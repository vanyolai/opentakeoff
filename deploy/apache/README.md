# Apache self-hosted publish

This downstream helper builds the web application with the supported
Dockerfile stored in this repository and publishes the verified static output
into the existing Apache content volume. It is tailored to this layout:

```text
/mnt/applications/stacks/opentakeoff/
  source/                  # this repository; includes the supported Dockerfile
/mnt/applications/data/production/opentakeoff/
```

Prepare the target once:

```bash
sudo install -d -o 1000 -g 1000 -m 0755 /mnt/applications/data/production/opentakeoff
```

The host also needs Docker and `rsync` (on Debian/Ubuntu: `sudo apt install
rsync`). Node.js and npm are only used inside the builder image. The build uses
`deploy/selfhosted/Dockerfile`; no separate stack-level Dockerfile needs to be
kept in sync.

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
`OPENTAKEOFF_PUBLISH_DIR`. Hungarian is the default build language; override it
with `OPENTAKEOFF_DEFAULT_LANGUAGE=en`. Apache does not need a reload when only
these static files change.
