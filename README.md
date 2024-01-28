
# NativeDB

A web application to explore RTTI database of Cyberpunk 2077. It includes a 
custom tool to write / merge documentation.

## Setup

You must install RTTI dump assets yourself. You will need [RTTIDumper]:
1. Clone it
2. Build it by following its README.
3. Install it like any other RED4ext plugin.
4. Run the game, wait (loading will block)... and close the game.
5. Copy generated files listed below from `<game>\bin\x64\dumps\ast\json` 
   to `<project>\src\assets\reddump\`:

- enums.json
- bitfields.json
- classes.json
- globals.json

## Development server

Run `npm run start` for a dev server. Navigate to `http://localhost:4200/`. 
The application will automatically reload if you change any of the source 
files.

## Test
Run `npm run test` to run unit tests with [Jest].

## Build

Run `npm run build` to build the project. The build artefacts will be stored 
in the `dist/browser/` directory. It will compress build files using `brotli` 
algorithm. The biggest AST file will be around ~800KB. It should be small 
enough given the usage of a Service Worker.

## Test server

Run `npm run prod` after you built the project. Navigate to 
`http://localhost:4400`. The application will run with Service Worker enabled. 
You might need to disable your antivirus to serve compressed files.

<!-- Table of links -->
[RTTIDumper]: https://github.com/WopsS/RED4.RTTIDumper
[Jest]: https://jestjs.io/