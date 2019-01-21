#!/bin/sh
sudo motion -b
cd final
export FLASK_APP=application.py
flask run --host=0.0.0.0
$SHELL