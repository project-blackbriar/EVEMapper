# Artemis mapper for EVE Online
Requires [Mapper Service](https://github.com/project-blackbriar/EVEMapper-Service) to be running as the backend.

Requires [Node.js](https://nodejs.org/en/download/) for installation and building.

## ESI App setup
Go to [EVE Online Developers](https://developers.eveonline.com/applications) and create a new application. Give it a name and description, and select `Authentication & API Access`. The Callback URL needs to point to the location where your mapper will be served, suffixed by `/sso/callback`.

`https://<your_url>/sso/callback`

If setting up for local development, use `http://localhost:8080/sso/callback` as the callback URL.

Click `Create Application`, then `View Application` and make a note of the Cliend ID and Secret Key.

## Development setup
Copy `dotenv-example` file to `.env` and edit to fill in your ESI app ID. URL defaults are set up for local development. Do NOT put the Secret Key in this file.
```
cp dotenv-example .env
nano .env
```
Install nequired Node packages and run development server.
```
npm install
npm run serve
```
You should see a message that the app is running on port `8080`. Click the link to go open the app.

If it is running on a different port, make sure nothing else is running on port `8080`, or change the callback URL both on [EVE Online Developers](https://developers.eveonline.com/applications) and in your `.env` file. The port in all 3 locations MUST be exactly the same.

## Production deployment
Copy `dotenv-example` file to `.env` and edit to fill in your details.
```
cp dotenv-example .env
nano .env
```
`VUE_APP_API_URL` points to where `Mapper-Service` is running, and `VUE_APP_API_CALLBACK` is the callback URL you set up in your ESI app. Do NOT put the Secret Key in this file.

Install nequired Node packages and compile for production.
```
npm install
npm run build
```
A `dist` folder will appear, point your webserver to this folder as document root.

