use axum::ServiceExt;
use axum::extract::Request;
use quack_server::{
    app, config::Config, db::Db, migrate, plugins::Plugins, state::AppState, storage::Storage,
};
use tokio_util::sync::CancellationToken;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

    let config = Config::load()?;
    let db = Db::connect(&config.database_url).await?;

    match std::env::args().nth(1).as_deref() {
        None | Some("serve") => serve(config, db).await,
        Some("migrate") => migrate::run(&db).await,
        Some("invite") => {
            migrate::run(&db).await?;
            println!("{}", migrate::invite(&db, &config.base_url).await?);
            Ok(())
        }
        Some(other) => {
            anyhow::bail!("unknown command: {other} (expected serve, migrate or invite)")
        }
    }
}

async fn serve(config: Config, db: Db) -> anyhow::Result<()> {
    migrate::run(&db).await?;
    let storage = Storage::new(&config.storage)?;
    let port = config.port;
    let plugins = Plugins::load(&config);
    let state = AppState::new(config, db, storage, plugins.commands());

    plugins.start(&state);
    app::spawn_jobs(state.clone());
    let listener = tokio::net::TcpListener::bind(("0.0.0.0", port)).await?;
    tracing::info!("listening on http://0.0.0.0:{port}");
    let service = <_ as ServiceExt<Request>>::into_make_service(app::router(state.clone()));
    axum::serve(listener, service)
        .with_graceful_shutdown(shutdown(state.shutdown.clone()))
        .await?;
    Ok(())
}

async fn shutdown(token: CancellationToken) {
    let ctrl_c = async {
        let _ = tokio::signal::ctrl_c().await;
    };
    #[cfg(unix)]
    let terminate = async {
        if let Ok(mut signal) =
            tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
        {
            signal.recv().await;
        }
    };
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();
    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }
    tracing::info!("shutting down");
    token.cancel();
}
