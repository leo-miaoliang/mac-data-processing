#!/bin/sh
set -e
VERSION=1.0
IMAGE_NAME=temp_mac_data_process
DOCKER_HOST=registry.cn-hangzhou.aliyuncs.com
DOCKER_NAMESPACE=uuabc_temp
DOCKER_REPO=${DOCKER_HOST}/${DOCKER_NAMESPACE}/${IMAGE_NAME}

if [ "${NODE_ENV}" = "" ]; then
    echo "NODE_ENV is not set"
    exit 1;
fi

echo "Version:${VERSION}, NODE_ENV:${NODE_ENV}"

matchingStarted=$(docker ps -a --filter="name=${IMAGE_NAME}" -q | xargs)
[[ -n ${matchingStarted} ]] && docker stop ${matchingStarted} && docker rm ${matchingStarted}

docker login -u hi50053306@aliyun.com -p Crh88888888 ${DOCKER_HOST}
docker pull ${DOCKER_REPO}:${VERSION}

docker run -d -v /data-mac:/tmp \
--env INPUT_BASE_PATH=/tmp/mac_addr \
--env OUTPUT_BASE_PATH=/tmp/output \
--env CLIENTINFO_BASE_PATH=/tmp/people_loc \
--env START_DATE=2019-01-23 \
71dcef00022e \
node --max-old-space-size=10240 /code/index.js