#!/bin/sh

PKG_NAME="metrovalencia.zip"
FILES=`find extension -not -name "." -not -path "*.git*" -not -name "*.xcf" -not -name "*.sh"`

gulp build
zip ${PKG_NAME} ${FILES}
