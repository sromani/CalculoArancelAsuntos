#!/bin/sh
# Genera Caddyfile según DOMAINS (lista separada por comas) y ACME_EMAIL.
set -eu

OUT="/etc/caddy/Caddyfile"
DOMAINS="${DOMAINS:-}"
ACME_EMAIL="${ACME_EMAIL:-}"

if [ -n "$DOMAINS" ]; then
  SITE_LIST=""
  OLDIFS=$IFS
  IFS=','
  for part in $DOMAINS; do
    d=$(echo "$part" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    [ -z "$d" ] && continue
    if [ -z "$SITE_LIST" ]; then
      SITE_LIST="$d"
    else
      SITE_LIST="$SITE_LIST, $d"
    fi
  done
  IFS=$OLDIFS

  {
    if [ -n "$ACME_EMAIL" ]; then
      echo "{"
      echo "	email ${ACME_EMAIL}"
      echo "}"
      echo ""
    fi
    echo "${SITE_LIST} {"
    echo "	reverse_proxy web:3000"
    echo "}"
    echo ""
    echo ":80 {"
    echo "	reverse_proxy web:3000"
    echo "}"
  } >"$OUT"
  echo "[caddy] HTTPS para: ${SITE_LIST}"
else
  cat >"$OUT" <<'EOF'
:80 {
	reverse_proxy web:3000
}
EOF
  echo "[caddy] Solo HTTP en :80"
fi
