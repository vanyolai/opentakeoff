# Apache self-hosted publish

This downstream helper builds the web application with the Dockerfile one
directory above the repository and publishes the verified static output into
the existing Apache content volume. It is tailored to this layout:

```text
/mnt/applications/stacks/opentakeoff/
  Dockerfile
  .dockerignore
  source/                  # this repository
/mnt/applications/data/production/opentakeoff/
```

Prepare the target once:

```bash
sudo install -d -o 1000 -g 1000 -m 0755 /mnt/applications/data/production/opentakeoff
```

The host also needs Docker and `rsync` (on Debian/Ubuntu: `sudo apt install
rsync`). Node.js and npm are only used inside the builder image.

Publish the currently checked-out source:

```bash
cd /mnt/applications/stacks/opentakeoff/source
./deploy/apache/build-and-publish.sh
```

To fast-forward the current branch from `origin` before building:

```bash
./deploy/apache/build-and-publish.sh --pull
```

The script stops on a dirty checkout before pulling, builds in Docker, verifies
`index.html` and `assets`, then uses `rsync --delete` only inside the configured
OpenTakeoff publication directory. Override that directory with
`OPENTAKEOFF_PUBLISH_DIR`. Apache does not need a reload when only these static
files change.
