import { EditorView } from "@codemirror/view";
import { editorInfoField } from "obsidian";
import { editorGeoLink, plainLinkClick } from "../core/geo-link-follow";
import type WayfarerPlugin from "../main";
import { readingGeoLinks } from "./reading";

/** Capture ordinary activations only. The real href remains available to native link menus. */
export function geoLinkClicks(plugin: WayfarerPlugin): (event: MouseEvent) => void {
  return (event) => {
    if (!plugin.settings.followGeoLinks || !plainLinkClick(event)) return;
    const element = event.target as HTMLElement | null;
    const link = element?.closest<HTMLElement>("a, .cm-link, .cm-url");
    if (!link) return;
    let target = readingGeoLinks.get(link);
    if (!target && link.closest(".markdown-source-view")) {
      const view = EditorView.findFromDOM(link);
      const file = view?.state.field(editorInfoField, false)?.file;
      if (!view || !file) return;
      try {
        const pos = view.posAtDOM(link);
        const line = view.state.doc.lineAt(pos);
        target = editorGeoLink(view.state.doc.toString(), line.number - 1, pos - line.from, file.path) ?? undefined;
      } catch { return; }
    }
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void plugin.followGeoLink(target);
  };
}
