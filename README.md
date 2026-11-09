# LAMP project for POOSD lab
A full-stack Color Manager built with the LAMP stack. 
The frontend is HTML/CSS, and the backend consists of PHP API endpoints.  

There is login functionality, and you can privately record and add colors.

https://4331c-colors-ethanzeng.online/

## Linting

The Frontend lint workflow runs on pushes and pull requests. It uses HTMLHint
for HTML, Stylelint for CSS, and ESLint for browser JavaScript.

Run the same checks locally from the repository root with Node.js 22:

```sh
npm ci --ignore-scripts
npm run lint
```
