# Plugin Authoring

AXIOM plugins extend the runtime through a small, explicit lifecycle API.

## Plugin shape

```ts
const plugin = {
  name: "my-plugin",
  version: "1.0.0",
  install(context) {
    context.on("run:start", (event) => {
      console.log(event.conversationId);
    });
  }
};
```

Register it:

```ts
await axiom.use(plugin);
```

## Available context

A plugin receives:

- `tools` — the runtime's `ToolRegistry`
- `on()` — event subscription
- `getConfig()` — read-only access to the AXIOM configuration object

## Security

The plugin context is not a security sandbox. A plugin is trusted application code.

Avoid reading environment secrets, accessing unrelated application data or registering privileged tools unless the application's security policy explicitly allows it.

## Versioning

Plugin authors should version their own APIs and declare the AXIOM package versions they support.

## Planned plugin capabilities

Future releases may add richer plugin lifecycle hooks, configuration schemas and capability registration. Those features are not part of 0.1.0.
