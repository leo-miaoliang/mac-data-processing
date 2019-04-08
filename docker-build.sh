#!/bin/sh
set -e
VERSION=1.0
IMAGE_NAME=temp_mac_data_process
DOCKER_HOST=registry.cn-hangzhou.aliyuncs.com
DOCKER_NAMESPACE=uuabc_temp
DOCKER_REPO=${DOCKER_HOST}/${DOCKER_NAMESPACE}/${IMAGE_NAME}

echo "Version:${VERSION}"

docker login -u hi50053306@aliyun.com -p Crh88888888 ${DOCKER_HOST}
docker build -t ${IMAGE_NAME}:${VERSION} .
docker tag ${IMAGE_NAME}:${VERSION} ${DOCKER_REPO}:${VERSION}
docker push ${DOCKER_REPO}:${VERSION}
