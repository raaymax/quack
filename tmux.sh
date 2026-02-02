#!/bin/bash
export SESS=quack
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$DIR"

tmux ls | grep $SESS
if [ $? -ne 0 ]
then
  # Tab 1: nvim
  tmux new-session -d -s $SESS -n "nvim" -c "$DIR"
  tmux send-keys -t $SESS:1 'nvim' C-m

  # Tab 2: claude
  tmux new-window -t $SESS -n "claude" -c "$DIR"
  tmux send-keys -t $SESS:2 'claude --dangerously-skip-permissions' C-m

  # Tab 3: dev servers (3 panes)
  tmux new-window -t $SESS -n "dev" -c "$DIR"
  tmux send-keys -t $SESS:3 'cd app && npm run dev' C-m
  tmux split-window -h -t $SESS:3 -c "$DIR"
  tmux send-keys -t $SESS:3.2 'deno task dev' C-m
  tmux split-window -v -t $SESS:3.2 -c "$DIR"
  tmux send-keys -t $SESS:3.3 'cd app && npm run storybook' C-m

  # Select first tab
  tmux select-window -t $SESS:1
fi
tmux attach -t $SESS
