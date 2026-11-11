import { useEffect, useRef } from "react";
import { createApp } from "vue";
import Prototype from "./Prototype.vue";

export default function App() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!host.current) return;
    const app = createApp(Prototype);
    app.mount(host.current);
    return () => app.unmount();
  }, []);

  return <div ref={host} />;
}
