#!/usr/bin/env -S deno run -A
/**
 * Generates SSL certificate with all local IP addresses as SANs.
 * This allows HTTPS to work from any device on your local network.
 *
 * Run: deno task ssl
 */

import { ensureDir } from "@std/fs";
import { join } from "@std/path";

// Get all local IP addresses
function getLocalIPs(): string[] {
  const ips = new Set<string>();

  // Always include these
  ips.add("127.0.0.1");
  ips.add("10.0.2.2"); // Android emulator

  // Get network interfaces
  const interfaces = Deno.networkInterfaces();
  for (const iface of interfaces) {
    if (iface.family === "IPv4" && !iface.address.startsWith("169.254")) {
      ips.add(iface.address);
    }
  }

  return Array.from(ips);
}

async function generateCert() {
  const sslDir = join(Deno.cwd(), "ssl");
  await ensureDir(sslDir);

  const ips = getLocalIPs();
  const hosts = ["localhost", ...ips.map((ip) => `IP:${ip}`)];
  const san = `DNS:localhost,${ips.map((ip) => `IP:${ip}`).join(",")}`;

  console.log("Generating SSL certificate with SANs:");
  hosts.forEach((h) => console.log(`  - ${h}`));

  const cmd = new Deno.Command("openssl", {
    args: [
      "req",
      "-x509",
      "-newkey",
      "rsa:4096",
      "-keyout",
      join(sslDir, "key.pem"),
      "-out",
      join(sslDir, "cert.pem"),
      "-days",
      "365",
      "-nodes",
      "-subj",
      "/CN=localhost",
      "-addext",
      `subjectAltName=${san}`,
    ],
    stdout: "inherit",
    stderr: "inherit",
  });

  const { code } = await cmd.output();

  if (code === 0) {
    console.log("\nCertificate generated successfully!");
    console.log(`  Key:  ${join(sslDir, "key.pem")}`);
    console.log(`  Cert: ${join(sslDir, "cert.pem")}`);
    console.log(
      "\nTo use on Android emulator, install ssl/cert.pem as CA certificate.",
    );
  } else {
    console.error("\nFailed to generate certificate");
    Deno.exit(1);
  }
}

await generateCert();
