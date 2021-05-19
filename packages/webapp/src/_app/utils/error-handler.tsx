import toast from "react-hot-toast";
import { Toast } from "react-hot-toast/dist/core/types";
import { HelpLink } from "_app/ui";

export const onError = (error: Error, title = "") => {
    console.error(title, error);

    let message = error.toString();
    message = message.replace("Error: assertion failure with message:", "");

    let toaster = toast.error;

    const eosResourceless = message.indexOf("transaction net usage") >= 0;
    if (eosResourceless) {
        toaster = toast;
        title = "Insufficient Resources";
    }

    toaster(
        (t) => (
            <div>
                {title && (
                    <>
                        <strong>{title}</strong>
                        <br />
                    </>
                )}
                {eosResourceless ? (
                    <EosResourceless t={t} message={message} />
                ) : (
                    message
                )}
            </div>
        ),
        {
            duration: eosResourceless ? 999_999_999 : undefined,
        }
    );
};

const EosResourceless = ({ t, message }: { t: Toast; message: string }) => (
    <div className="mt-2">
        <div className="flex items-center mb-1 space-x-1">
            <div>
                <p>
                    It seems like your EOS Account does not have necessary
                    resources to execute your transaction.
                </p>

                <p className="mt-2 text-xs text-red-500">{message}</p>
            </div>
            <HelpLink href="https://www.notion.so/edenos/EdenOS-c0c42c7c426f407fadb215a017b54eb9" />
        </div>
        <button
            className="text-sm underline hover:text-black mt-2"
            onClick={() => toast.dismiss(t.id)}
        >
            Dismiss
        </button>
    </div>
);
