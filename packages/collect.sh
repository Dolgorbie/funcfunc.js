#!/bin/bash

find funcfunc-core \( -path 'funcfunc-core/package-lock.json' -o -path 'funcfunc-core/dist' -o -path 'funcfunc-core/node_modules' \) -prune -o -type f \
-exec sh -c 'echo ; echo ; echo ================ {} ================ ; cat {}' \; > codes.txt
