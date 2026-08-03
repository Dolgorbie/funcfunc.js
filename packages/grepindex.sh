#!/bin/sh

grep -E -n -o -e '## BEGIN.*' codes*.txt > file-index.txt

grep -E -n -o -e '^.*\bexport\b.*$' codes*.txt | grep -E -v -e 'default'  > export-index.txt

grep -E -n -o -e '^.*\bimport\b.*$' codes*.txt | grep -E -v -e 'default'  > import-index.txt
