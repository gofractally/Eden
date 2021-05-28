import toast from "react-hot-toast";
import { HelpLink } from "_app/ui";

export const onError = (error: Error, title = "") => {
    console.error(title, error);

    let message = error.toString();
    message = message.replace("Error: assertion failure with message:", "");
    message = message.replace(
        "induction for this invitation is already in progress",
        "You already invited this member. If you want to modify the ceremony participants, please cancel the induction first in the membership page."
    );

    const insufficientResources =
        message.indexOf("transaction net usage") >= 0 ||
        message.indexOf("billed CPU time") >= 0;
    if (insufficientResources) {
        return eosResourcesError(message);
    }

    toast.error(
        <div>
            {title && (
                <>
                    <strong>{title}</strong>
                    <br />
                </>
            )}
            {message}
        </div>
    );
};

const eosResourcesError = (message: string) => {
    toast(
        (t) => (
            <div>
                <>
                    <strong>Insufficient Resources</strong>
                    <br />
                </>
                <div className="mt-2">
                    <div className="flex items-center mb-1 space-x-1">
                        <div>
                            <p>
                                It seems like your EOS Account does not have
                                necessary resources to execute your transaction.
                            </p>

                            <p className="mt-2 text-xs text-red-500">
                                {message}
                            </p>
                        </div>
                        <HelpLink href="https://www.notion.so/edenos/Insufficient-Resources-609b22f1e5744e329f25c15cc8b720bb" />
                    </div>
                    <button
                        className="text-sm underline hover:text-black mt-2"
                        onClick={() => toast.dismiss(t.id)}
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        ),
        {
            duration: 999_999_999,
        }
    );
};
