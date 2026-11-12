// Custom (Campaign Editor) scenario ids. A tiny module so the game shells can
// recognise a custom campaign without loading the editor's content tables.
export function isCustomScenarioId(id: string | undefined): boolean {
  return !!id && id.startsWith("custom-");
}
