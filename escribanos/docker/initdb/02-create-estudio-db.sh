#!/usr/bin/env bash
# Solo en volumen vacío (primera vez que levanta el contenedor).
psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER}" --dbname postgres \
  -c "CREATE DATABASE sistema_escribanos_estudio;"
