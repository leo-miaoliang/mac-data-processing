#!/bin/sh
set -o errexit
# INPUT_BASE_PATH=/Users/beaulizhu/Documents/workspace/uuabc/mac-data-process/data
# OUTPUT_BASE_PATH=/Users/beaulizhu/Documents/workspace/uuabc/mac-data-process/output
# ES_URL=10.68.100.21:9200
# START_DATE=2018-12-21

# export INPUT_BASE_PATH OUTPUT_BASE_PATH START_DATE


SYSTEM=`uname -s`
if [ "${START_DATE}" = "" ]; then
  if [ $SYSTEM = "Darwin" ] ; then
    START_DATE=`date -v -1d +%Y-%m-%d`
  else
    START_DATE=`date -d "-1 day" +%Y-%m-%d`
  fi
fi

if [ "$INPUT_BASE_PATH" = "" ]; then
  echo "NO INPUT_BASE_PATH SET"
  exit 0
fi

if [ "$OUTPUT_BASE_PATH" = "" ]; then
  echo "NO OUTPUT_BASE_PATH SET"
  exit 0
fi

if [ ! -d $INPUT_BASE_PATH/$START_DATE ]; then
  echo "INPUT FOLDER IS NOT EXISTS: $INPUT_BASE_PATH/$START_DATE"
  exit 0
fi

if [ ! -d $CLIENTINFO_BASE_PATH/$START_DATE ]; then
  echo "CLIENT INFO IS NOT EXISTS: $CLIENTINFO_BASE_PATH/$START_DATE"
  exit 0
fi



echo "Date:${START_DATE}"
TMP_DIR=/macaddr_tmp
TMP_DIR_WITHDATE=$TMP_DIR/${START_DATE}
mkdir -p $TMP_DIR_WITHDATE

cd $INPUT_BASE_PATH/$START_DATE
#if [ -e *.tgz ]; then
  echo "find tgz file and extract data"
  for file in `ls *.tgz`; do
    filename=${file%%.*}
    mkdir -p $TMP_DIR_WITHDATE/$filename
    tar -xzf $file -C $TMP_DIR_WITHDATE/$filename
  done
  INPUT_BASE_PATH=$TMP_DIR
#fi


OUTPUT_DIR=$OUTPUT_BASE_PATH/$START_DATE
OUTPUT_FILE=$OUTPUT_DIR/PROCESSED

echo "INPUT BASE PATH: $INPUT_BASE_PATH"

export TMP_INPUT_BASE
cd /code
if [ -f $OUTPUT_FILE ]; then
  if [ "$FORCE" = "FORCE" ]; then
    echo "Clear OUTPUT FOLDER:$OUTPUT_DIR"
    rm -rf $OUTPUT_DIR

    echo "Clear exists index: $ES_URL/macaddr-${START_DATE//-/.}"
    curl -s -X DELETE "$ES_URL/macaddr-${START_DATE//-/.}";echo 

    echo "START DO: ${START_DATE}"
    node -r esm ./index.js

    # cd $OUTPUT_DIR
    # if [ -f es.json ]; then
    #   echo "SPLIT to files >>>"
    #   cd $OUTPUT_DIR && split -l 10000 es.json es-json-
    # fi
  fi
else
  echo "START DO: ${START_DATE}"
  node -r esm ./index.js

  touch $OUTPUT_FILE

  # echo "SPLIT to files >>>"
  # cd $OUTPUT_DIR && split -l 10000 es.json es-json-
fi

cd $OUTPUT_DIR 

s_num='20000'
for file in `ls | grep '^es-json-.*[0-9]$'`; do
    b=$(wc -l $file)
    ln=${b%% *}
    if test $ln -gt $s_num
    then
        #split
        split -l $s_num $file $file'-'
        #rm old
        rm $file
    fi
done

for file in `ls | grep es-json-`; do
  echo "POST TO ES $file"
  curl -o $OUTPUT_DIR/.es_log-$file -s -H "Content-Type: application/x-ndjson" -XPOST $ES_URL/_bulk --data-binary "@${file}" --speed-time 5 --speed-limit 1
  rm -rf $file
  sleep 2s
done

echo "FINISHED..."
exit 0