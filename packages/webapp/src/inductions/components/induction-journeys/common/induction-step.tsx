import { InductionStep } from "inductions";

export type Step = {
    key: InductionStep;
    title: string;
    text: string;
};

interface SingleStepProps {
    step: Step;
    last: boolean;
    current: boolean;
    complete: boolean;
}

const SingleStep = ({ step, last, current, complete }: SingleStepProps) => {
    return (
        <div className="flex relative pb-12">
            {complete ? (
                <CompleteStepPath last={last} />
            ) : current ? (
                <CurrentStepPath last={last} />
            ) : (
                <PendingStepPath last={last} />
            )}

            <div className="flex-grow pl-4">
                <h2 className="font-medium title-font text-sm text-gray-900 mb-1 tracking-wider">
                    {step.title}
                </h2>
                <p className="leading-relaxed">{step.text}</p>
            </div>
        </div>
    );
};

interface StepPath {
    last: boolean;
}

const CompleteStepPath = ({ last }: StepPath) => (
    <>
        {!last && (
            <div className="h-full w-10 absolute inset-0 flex items-center justify-center">
                <div className="h-full w-1 bg-blue-500 pointer-events-none"></div>
            </div>
        )}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 inline-flex items-center justify-center text-white relative z-10">
            <svg
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="4"
                className="w-8 h-8"
                viewBox="0 0 52 52"
            >
                <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"></path>
            </svg>
        </div>
    </>
);

const CurrentStepPath = ({ last }: StepPath) => (
    <>
        {!last && (
            <div className="h-full w-10 absolute inset-0 flex items-center justify-center">
                <div className="h-full w-1 bg-gray-300 pointer-events-none"></div>
            </div>
        )}
        <div className="flex-shrink-0 w-10 h-10 rounded-full border-4 border-blue-500 bg-white inline-flex items-center justify-center text-white relative z-10">
            <svg
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="4"
                className="w-9 h-9 fill-current stroke-current text-blue-500"
                viewBox="0 0 36 120"
            >
                <circle cx="18" cy="60" r="18"></circle>
            </svg>
        </div>
    </>
);

const PendingStepPath = ({ last }: StepPath) => (
    <>
        {!last && (
            <div className="h-full w-10 absolute inset-0 flex items-center justify-center">
                <div className="h-full w-1 bg-gray-300 pointer-events-none"></div>
            </div>
        )}
        <div className="flex-shrink-0 w-10 h-10 rounded-full border-4 border-gray-300 bg-white inline-flex items-center justify-center text-white relative z-10"></div>
    </>
);

export const Steps = ({
    steps,
    currentStep,
    isComplete = false, // marks the last step as complete
}: {
    steps: Step[];
    currentStep: InductionStep;
    isComplete?: boolean;
}) => {
    const currentStepIndex = steps.findIndex((s) => s.key === currentStep);
    return (
        <section className="text-gray-600 body-font">
            <div className="container p-5 mx-auto flex flex-wrap">
                <div className="flex flex-wrap">
                    {/* z-index of -1 ensures relative positioned children do not appear over profile popover. */}
                    <div className="md:pr-10 md:py-6" style={{ zIndex: -1 }}>
                        {steps.map((s, i) => {
                            return (
                                <SingleStep
                                    key={`step-${s.key}`}
                                    step={s}
                                    last={i === steps.length - 1}
                                    current={s.key === currentStep}
                                    complete={
                                        isComplete || i < currentStepIndex
                                    }
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};
