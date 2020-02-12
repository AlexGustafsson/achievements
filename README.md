# Achievements
### A GitLab webhook listener to add achievements to interactions
***

## Quick Start

#### Running using Docker

```
# Build the Docker image
./build.sh

# Run the Docker image
docker run -it axgn/achievements
```

#### Running from source

```
# Clone the repository
git clone git@github.com/AlexGustafsson/achievements

# Enter the repository and install the dependencies
cd achievements
npm install

# Start the project
npm start
```

## Documentation

### Running

```
# Run in production mode
npm start

# Run in development mode
npm run dev
```

The port can be controlled using the environment variable `PORT`. To configure the server to verify GitLab webhooks, use the environment variable `GITLAB_ENVIRONMENT`.

The application should run behind a reverse proxy as it does not handle TLS, load balancing, rate limiting or other imortant techniques.

### Configuration

Currently configuration is done via environment variables. These can be found in the section above.

### API

The API is currently undocumented. Please see the `src/index.js` file for current routes.

### Achievements

The list of achievements is currently undocumented. Please see the `src/achievements.json` file for current achievements. This file is merely the available achievements, not how achievements are implemented.

#### Implementing an achievement

The application exposes GitLab's webhooks as hooks available within the `hooks` directory. Each file corresponds to an event type available via [GitLab's webhooks](https://docs.gitlab.com/ee/user/project/integrations/webhooks.html).

Each exported function in a hook file will be executed when an event is received from GitLab. Currently the documentation of the API is sparse, but there are some implementations from which one should be able to interpolate an implementation.

## Contributing

### Guidelines

```
# Clone the repository
git clone git@github.com/AlexGustafsson/achievements

# Install dependencies
npm install

# Write code and commit it

# Follow the conventions enforced
npm run lint-javascript
npm run lint-shell
npm run lint-docker
npm run test
npm run coverage
npm run check-duplicate-code

# Run the project for manual testing
npm run dev
```

### Dependencies

This project targets NodeJS 13.

#### Development dependencies

**The following dependencies are available via npm.**

* [ava](https://github.com/avajs/ava)
* [husky](https://github.com/typicode/husky)
* [jsinspect](https://github.com/danielstjules/jsinspect)
* [nyc](https://github.com/istanbuljs/nyc)
* [xo](https://github.com/xojs/xo)

**The following dependencies need to be manually installed.**

* [ShellCheck](https://github.com/koalaman/shellcheck)
  * `brew install shellcheck`
  * `apt install shellcheck`
* [hadolint](https://github.com/hadolint/hadolint)
  * `brew install hadolint`

#### Runtime dependencies

**The following dependencies are available via npm.**

* [body-parser](https://github.com/expressjs/body-parser)
* [debug](https://github.com/visionmedia/debug)
* [express](https://github.com/expressjs/express)
* [lowdb](https://github.com/typicode/lowdb)
