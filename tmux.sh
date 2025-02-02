#!/bin/bash
export SESS=quack

pushd ./Writer/be

tmux ls | grep $SESS
if [ $? -ne 0 ]
then
  tmux new-session -d -s $SESS -n "shell"
  tmux send-keys -t $SESS:1.1 'npm run dev' C-m
  tmux split-window -h -t $SESS
  tmux send-keys -t $SESS:1.2 'deno task dev' C-m
  tmux split-window -h -t $SESS
  tmux send-keys -t $SESS:1.3 'cd app && npm run storybook' C-m
fi
tmux attach -t $SESS

popd
