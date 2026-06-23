import type { RichCard as RichCardType } from "@snipdash/sdk";
import { MarkdownView } from "./MarkdownView";
import { CodeView } from "./CodeView";
import { TodoView } from "./TodoView";

export function RichCard({ card, edit }: { card: RichCardType; edit: boolean }) {
  switch (card.payload.mode) {
    case "markdown":
      return <MarkdownView card={card} source={card.payload.source} edit={edit} />;
    case "code":
      return <CodeView card={card} language={card.payload.language} source={card.payload.source} edit={edit} />;
    case "todo":
      return (
        <TodoView
          card={card}
          items={card.payload.items}
          hideCompleted={card.payload.hideCompleted ?? true}
          edit={edit}
        />
      );
  }
}
