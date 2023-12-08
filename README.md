# NativeDB

A web application to explore RTTI database of Cyberpunk 2077.

## Setup

You must install RTTI dump assets yourself. You will need [RTTIDumper]:
1. Clone it
2. Build it by following its README.
3. Install it like any other RED4ext plugin.
4. Run the game and wait...
5. Copy generated files listed below from `<game>\bin\x64\dumps\ast\json` to `<project>\src\assets\reddump\`:

- enums.json
- bitfields.json
- classes.json
- globals.json

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The 
application will automatically reload if you change any of the source files.

To run this application with a Service Worker enabled, you can compress build
files using `gzip` algorithm and execute `npm run prod`. By default, Brotli
files are only served over a secure connection (which needs extra
configuration).

## Build

Run `ng build` to build the project. The build artifacts will be stored in the 
`dist/` directory. It will compress build files using `brotli` algorithm. The 
biggest AST file will be around ~800KB. It should be small enough given the 
usage of a Service Worker.

<!-- Table of links -->
[RTTIDumper]: https://github.com/WopsS/RED4.RTTIDumper
