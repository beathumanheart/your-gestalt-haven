import type { WorksheetBlock as Block } from "@/content/automaticYes";
import type { Answers } from "./useWorksheetAnswers";
import BodyMap, { type Dot } from "./BodyMap";
import Pills from "./Pills";

/**
 * One numbered block of the worksheet, by kind.
 *
 * Class names and element choices follow design-assets/automatic-yes/
 * web-prototype.html, which is the visual spec — `.q` for a question label,
 * `.two` for a pair, `.grow` for a moment row, and so on. Inventing names here
 * would leave the page unstyled in ways that only show up on screen.
 *
 * Every input carries a visible label, or a `.clabel` referenced by
 * `aria-labelledby`. A page that asks someone to write about being unable to
 * say no should not also make them guess what a box is for.
 */

interface Props {
  block: Block;
  answers: Answers;
  setAnswer: (id: string, value: unknown) => void;
  ui: { figureHint: string; figureLabel: string; otherPlaceholder: string };
}

/** Sub-fields sit under the block's id, so clearing one clears all of them. */
const subId = (id: string, index: number) => `${id}-${index}`;

const text = (answers: Answers, id: string) => String(answers[id] ?? "");
const list = (answers: Answers, id: string) => (answers[id] as string[] | undefined) ?? [];

const WorksheetBlock = ({ block, answers, setAnswer, ui }: Props) => {
  if (block.kind === "example") {
    return <p className="example">{block.text}</p>;
  }

  const number = (
    <div className="num" aria-hidden="true">
      {block.n}
    </div>
  );

  const body = () => {
    switch (block.kind) {
      case "text":
        return (
          <>
            <label className="q" htmlFor={block.id}>
              {block.question}
            </label>
            {block.hint && <div className="hint">{block.hint}</div>}
            <textarea
              id={block.id}
              rows={block.rows}
              value={text(answers, block.id)}
              onChange={(event) => setAnswer(block.id, event.target.value)}
            />
          </>
        );

      case "choice":
        return (
          <fieldset>
            <legend className="q">{block.question}</legend>
            {block.hint && <div className="hint">{block.hint}</div>}
            <Pills
              name={block.id}
              options={block.options}
              single={block.single}
              other={block.other}
              otherPlaceholder={ui.otherPlaceholder}
              value={list(answers, block.id)}
              otherValue={text(answers, `${block.id}-other`)}
              onChange={(next) => setAnswer(block.id, next)}
              onOtherChange={(next) => setAnswer(`${block.id}-other`, next)}
            />
          </fieldset>
        );

      case "body":
        return (
          <div className="figwrap">
            <div>
              <label className="q" htmlFor={block.id}>
                {block.question}
              </label>
              <div className="hint">{block.hint}</div>
              <textarea
                id={block.id}
                rows={block.rows}
                value={text(answers, block.id)}
                onChange={(event) => setAnswer(block.id, event.target.value)}
              />
            </div>
            <div className="map">
              <BodyMap
                label={ui.figureLabel}
                dots={(answers["body-dots"] as Dot[] | undefined) ?? []}
                onChange={(next) => setAnswer("body-dots", next)}
              />
              <div className="cap">{ui.figureHint}</div>
            </div>
          </div>
        );

      case "pair":
        return (
          <>
            <div className="q">{block.question}</div>
            <div className="two">
              {block.columns.map((column, index) => (
                <div key={column}>
                  {/* A div labelled by id rather than a <label>: the prototype's
                      shape, and it still gives the textarea a name. */}
                  <div className="clabel" id={`${subId(block.id, index)}-l`}>
                    {column}
                  </div>
                  <textarea
                    id={subId(block.id, index)}
                    rows={3}
                    aria-labelledby={`${subId(block.id, index)}-l`}
                    value={text(answers, subId(block.id, index))}
                    onChange={(event) => setAnswer(subId(block.id, index), event.target.value)}
                  />
                </div>
              ))}
            </div>
          </>
        );

      case "form":
        return (
          <>
            <div className="q">{block.question}</div>
            {block.rows.map((row, index) => (
              <div key={row.label}>
                <label className="clabel" htmlFor={subId(block.id, index)}>
                  {row.label}
                </label>
                <div className="hint">{row.hint}</div>
                <textarea
                  id={subId(block.id, index)}
                  rows={2}
                  value={text(answers, subId(block.id, index))}
                  onChange={(event) => setAnswer(subId(block.id, index), event.target.value)}
                />
              </div>
            ))}
          </>
        );

      case "moments":
        return (
          <>
            <div className="q">{block.question}</div>
            <div className="hint">{block.hint}</div>
            {Array.from({ length: block.count }, (_, index) => {
              const id = subId(block.id, index);
              const label = `${block.placeholder} ${index + 1}`;
              return (
                <div className="grow" key={id}>
                  <input
                    type="text"
                    id={id}
                    placeholder={block.placeholder}
                    aria-label={label}
                    value={text(answers, id)}
                    onChange={(event) => setAnswer(id, event.target.value)}
                  />
                  <div className="pills" role="radiogroup" aria-label={label}>
                    {block.choices.map((choice) => (
                      <label
                        className={`pill${text(answers, `${id}-c`) === choice ? " on" : ""}`}
                        key={choice}
                      >
                        <input
                          type="radio"
                          name={`${id}-c`}
                          value={choice}
                          checked={text(answers, `${id}-c`) === choice}
                          onChange={() => setAnswer(`${id}-c`, choice)}
                        />
                        <span>{choice}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        );

      case "chew":
      default:
        return (
          <>
            <div className="q">{block.question}</div>
            <div className="sublist">
              {block.subs.map((sub, index) => (
                <div key={sub.question}>
                  <label className="sq" htmlFor={subId(block.id, index)}>
                    {sub.question}
                  </label>
                  <textarea
                    id={subId(block.id, index)}
                    rows={sub.rows}
                    value={text(answers, subId(block.id, index))}
                    onChange={(event) => setAnswer(subId(block.id, index), event.target.value)}
                  />
                </div>
              ))}
            </div>
          </>
        );
    }
  };

  return (
    <div className="qb">
      {number}
      <div>{body()}</div>
    </div>
  );
};

export default WorksheetBlock;
