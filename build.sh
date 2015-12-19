#!/bin/sh

PKG_NAME="metrovalencia.zip"

gulp build
FILES=`find extension -not -name "." -not -path "*.git*" -not -name "*.xcf" -not -name "*.sh"`

zip ${PKG_NAME} ${FILES}
