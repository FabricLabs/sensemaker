import { H1, Stack, Text, useCanvasState } from "cursor/canvas";
import type { CSSProperties } from "cursor/canvas";

type Title = string;

const title: Title = "Canvas fixture";

export default function Fixture(): CSSProperties {
  const [note] = useCanvasState("note", "default");
  return (
    <Stack gap={8}>
      <H1>{title}</H1>
      <Text>Rendered from a directory.</Text>
      <Text>{note}</Text>
    </Stack>
  );
}
