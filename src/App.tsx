import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { LineChart } from "@mui/x-charts";
import { BigDecimal } from "@joaonmatos/decimal";
import { useCallback, useEffect, useMemo, useState } from "react";
import { allProbabilities } from "./math";

const formSchema = z.object({
  n: z.string().pipe(z.number({ coerce: true }).int().min(0).max(512)),
  p: z.string().pipe(z.number({ coerce: true }).min(0).max(1)),
});

type AppState = {
  readonly current: {
    readonly n: number;
    readonly p: number;
  };
  readonly history: {
    readonly n: number;
    readonly p: number;
  }[];
};

export function App() {
  const [state, setState] = useState<AppState>({
    current: {
      n: 16,
      p: 0.5,
    },
    history: [],
  });
  const setParams = useCallback(
    (n: number, p: number) =>
      setState((state) => {
        if (state.current.n === n && state.current.p === p) {
          return state;
        }
        return {
          current: { n, p },
          history: [state.current, ...state.history],
        };
      }),
    [setState]
  );
  const probabilities = useMemo(
    () => allProbabilities(state.current.n, state.current.p),
    [state]
  );
  const download = useCallback(
    () => downloadCsv(probabilities),
    [probabilities]
  );
  const form = useForm({
    defaultValues: {
      n: `${state.current.n}`,
      p: `${state.current.p}`,
    },
    validators: {
      onChange: formSchema,
    },
    onSubmit: ({ value }) => {
      const { n, p } = formSchema.parse(value);
      setParams(n, p);
    },
  });
  const reset = useCallback(
    () => form.reset({ n: `${state.current.n}`, p: `${state.current.p}` }),
    [state, form]
  );
  useEffect(() => reset(), [state]);
  return (
    <>
      n: {state.current.n}
      <br />
      p: {state.current.p}
      <br />
      <LineChart
        series={[{ data: probabilities.map((d) => d.number()) }]}
        width={800}
        height={600}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field
          name="n"
          children={(field) => (
            <>
              <input
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                min={0}
                max={512}
                placeholder="Number of independent tries (n)"
                step={1}
              />
              {field.state.meta.errors.length ? (
                <em>{field.state.meta.errors.join(",")}</em>
              ) : null}
            </>
          )}
        />
        <form.Field
          name="p"
          children={(field) => (
            <>
              <input
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                min={0}
                max={1}
                placeholder="Probability of each try's success (p)"
                step={0.05}
              />
              {field.state.meta.errors.length ? (
                <em>{field.state.meta.errors.join(",")}</em>
              ) : null}
            </>
          )}
        />
        <button type="submit">Submit</button>
      </form>
      <button onClick={reset}>Reset</button>
      <button onClick={download}>Download CSV</button>
      {state.history.length > 0 && (
        <>
          <h3>History</h3>
          <ul>
            {state.history.map((entry, i) => (
              <li key={i}>
                <a href="#" onClick={() => setParams(entry.n, entry.p)}>
                  n: {entry.n}&#9;p: {entry.p}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function downloadCsv(frequencies: BigDecimal[]) {
  const text =
    "k,p\n" +
    frequencies
      .map((frequency, index) => `${index},${frequency.toString()}`)
      .join("\n");
  const blob = new Blob([text], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = "frequencies.csv";
  link.href = url;
  link.click();
}
