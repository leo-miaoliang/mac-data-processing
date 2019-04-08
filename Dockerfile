FROM node:10-alpine
LABEL author="Beauli Zhu"

ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apk add --update coreutils curl && rm -rf /var/cache/apk/*

COPY ./package.json /code/package.json
WORKDIR /code
RUN npm install --production --registry=https://nexus.51uuabc.com/repository/npm-all/

COPY . /code

# CMD ["./run.sh"]
CMD ["node","index.js"]
