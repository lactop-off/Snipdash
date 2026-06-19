# Snipdash development image.
#
# Provides the full Tauri toolchain on Debian Bookworm: Rust (from the base
# image) plus Node.js 22, pnpm, and the Linux WebView/build dependencies that
# Tauri needs. Intended for development, testing, browser-based UI work, and
# building the Linux (.deb) bundle. See docs/docker.md for usage.

FROM rust:1-bookworm

ENV DEBIAN_FRONTEND=noninteractive

# --- Tauri / Linux desktop build dependencies ---
RUN apt-get update && apt-get install -y --no-install-recommends \
      libwebkit2gtk-4.1-dev \
      libgtk-3-dev \
      libayatana-appindicator3-dev \
      librsvg2-dev \
      librsvg2-bin \
      libsoup-3.0-dev \
      libssl-dev \
      build-essential \
      pkg-config \
      curl \
      file \
      git \
      ca-certificates \
      xvfb \
      x11-utils \
    && rm -rf /var/lib/apt/lists/*

# --- Node.js 22 + pnpm ---
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && npm install -g pnpm@10 \
    && rm -rf /var/lib/apt/lists/*

# Keep the Cargo target dir on a cache volume (see docker-compose.yml) and make
# pnpm's global bin available on PATH.
ENV CARGO_TARGET_DIR=/workspace/target \
    PNPM_HOME=/usr/local/share/pnpm \
    PATH=/usr/local/share/pnpm:$PATH

WORKDIR /workspace

# Vite dev server (UI development from the host browser).
EXPOSE 1420

CMD ["bash"]
