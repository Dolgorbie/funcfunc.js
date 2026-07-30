#!/bin/bash

find funcfunc-core \( \
                        -path 'funcfunc-core/package-lock.json' \
                     -o -path 'funcfunc-core/dist' \
                     -o -path 'funcfunc-core/node_modules' \
                     -o -name '.DS_Store' \
                   \) -prune \
                   -o -type f \
-exec sh -c 'echo ; echo ; echo \#\# FILE: {} ================================ ; echo ; cat {}' \; > codes.txt
