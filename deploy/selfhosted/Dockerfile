# syntax=docker/dockerfile:1

# Build with Debian/glibc. The web dependency tree contains native optional
# packages (Rollup, esbuild, sharp and canvas); Alpine/musl is intentionally
# kept out of the build stage so a static deploy does not depend on an
# experimental Node platform.
FROM node:24-bookworm-slim AS builder

WORKDIR /build

COPY web/package.json web/package-lock.json ./
# The browser build does not need the optional Node CUDA download.
RUN ONNXRUNTIME_NODE_INSTALL=skip npm ci --no-audit --no-fund

COPY web/ ./

ARG VITE_DEFAULT_LANGUAGE=en
ENV VITE_DEFAULT_LANGUAGE=$VITE_DEFAULT_LANGUAGE
ARG VITE_OCR=on
ENV VITE_OCR=$VITE_OCR

RUN npm run check:ort \
    && npm run stage:ocr \
    && npm run build \
    && npm run check:ocr-dist \
    && test -s dist/index.html \
    && test -d dist/assets \
    && test -s dist/demo/sample-finish-plan.pdf \
    && if [ "$VITE_OCR" != "off" ]; then test -s dist/models/ocr/manifest.json; fi


# Only static output reaches the runtime image. Alpine is safe here because no
# Node process or native JavaScript dependency runs in this stage.
FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime

USER root

COPY deploy/selfhosted/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder --chown=1000:1000 /build/dist/ /usr/share/nginx/html/

RUN chown 1000:1000 /etc/nginx/conf.d/default.conf

USER 1000:1000

EXPOSE 8080
