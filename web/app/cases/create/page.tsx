import { CreateCaseForm } from "components/create-case-form";

export default function CreateCasePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create New Case</h1>
                <p className="text-slate-500 mt-1">
                    Capture customer and loan details to initiate a new delinquency case.
                </p>
            </div>
            <CreateCaseForm />
        </div>
    );
}
