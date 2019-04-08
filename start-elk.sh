#!/bin/bash
docker network create elk
docker run -d --name elasticsearch --net elk -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" elasticsearch:6.5.3
docker run -d --name kibana --net elk -p 5601:5601 kibana:6.5.3