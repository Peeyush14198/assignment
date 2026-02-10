'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select } from './ui/select';
import { createFullCase } from '../lib/api';

export function CreateCaseForm() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        customer: {
            name: '',
            phone: '',
            email: '',
            country: '',
            riskScore: 700
        },
        loan: {
            principal: '',
            outstanding: '',
            dueDate: ''
        }
    });

    const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            customer: { ...prev.customer, [name]: name === 'riskScore' ? Number(value) : value }
        }));
    };

    const handleLoanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            loan: {
                ...prev.loan,
                [name]: name === 'principal' || name === 'outstanding' ? Number(value) : value
            }
        }));
    };

    const validateStep1 = () => {
        return (
            formData.customer.name &&
            formData.customer.email &&
            formData.customer.phone &&
            formData.customer.country
        );
    };

    const validateStep2 = () => {
        return (
            formData.loan.principal &&
            formData.loan.outstanding &&
            formData.loan.dueDate
        );
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            await createFullCase({
                customer: formData.customer,
                loan: {
                    ...formData.loan,
                    principal: Number(formData.loan.principal),
                    outstanding: Number(formData.loan.outstanding),
                    dueDate: new Date(formData.loan.dueDate).toISOString()
                }
            });
            router.push('/cases');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Failed to create case');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8 flex justify-between items-center text-sm font-medium text-slate-500">
                <div className={step >= 1 ? 'text-primary-600' : ''}>1. Customer Details</div>
                <div className="h-px bg-slate-200 flex-1 mx-4"></div>
                <div className={step >= 2 ? 'text-primary-600' : ''}>2. Loan Details</div>
                <div className="h-px bg-slate-200 flex-1 mx-4"></div>
                <div className={step >= 3 ? 'text-primary-600' : ''}>3. Review</div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        {step === 1 && 'Customer Information'}
                        {step === 2 && 'Loan Information'}
                        {step === 3 && 'Review & Submit'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
                            {error}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Full Name</label>
                                    <Input
                                        name="name"
                                        value={formData.customer.name}
                                        onChange={handleCustomerChange}
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Risk Score</label>
                                    <Input
                                        name="riskScore"
                                        type="number"
                                        min={300}
                                        max={850}
                                        value={formData.customer.riskScore}
                                        onChange={handleCustomerChange}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                    name="email"
                                    type="email"
                                    value={formData.customer.email}
                                    onChange={handleCustomerChange}
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Phone</label>
                                    <Input
                                        name="phone"
                                        value={formData.customer.phone}
                                        onChange={handleCustomerChange}
                                        placeholder="+1..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Country</label>
                                    <Select
                                        name="country"
                                        value={formData.customer.country}
                                        onChange={handleCustomerChange}
                                    >
                                        <option value="">Select Country</option>
                                        <option value="US">United States</option>
                                        <option value="IN">India</option>
                                        <option value="UK">United Kingdom</option>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Principal Amount</label>
                                    <Input
                                        name="principal"
                                        type="number"
                                        value={formData.loan.principal}
                                        onChange={handleLoanChange}
                                        placeholder="5000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Outstanding Amount</label>
                                    <Input
                                        name="outstanding"
                                        type="number"
                                        value={formData.loan.outstanding}
                                        onChange={handleLoanChange}
                                        placeholder="4500"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Due Date</label>
                                <Input
                                    name="dueDate"
                                    type="date"
                                    value={formData.loan.dueDate}
                                    onChange={handleLoanChange}
                                />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <h4 className="font-medium mb-2 text-slate-900">Customer</h4>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-slate-600">
                                    <p>Name: <span className="text-slate-900">{formData.customer.name}</span></p>
                                    <p>Email: <span className="text-slate-900">{formData.customer.email}</span></p>
                                    <p>Phone: <span className="text-slate-900">{formData.customer.phone}</span></p>
                                    <p>Country: <span className="text-slate-900">{formData.customer.country}</span></p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <h4 className="font-medium mb-2 text-slate-900">Loan</h4>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-slate-600">
                                    <p>Principal: <span className="text-slate-900">${formData.loan.principal}</span></p>
                                    <p>Outstanding: <span className="text-slate-900">${formData.loan.outstanding}</span></p>
                                    <p>Due Date: <span className="text-slate-900">{formData.loan.dueDate}</span></p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between mt-8">
                        {step > 1 ? (
                            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={loading}>
                                Back
                            </Button>
                        ) : (
                            <Button variant="outline" onClick={() => router.back()} disabled={loading}>
                                Cancel
                            </Button>
                        )}

                        {step < 3 ? (
                            <Button
                                onClick={() => setStep(s => s + 1)}
                                disabled={(step === 1 && !validateStep1()) || (step === 2 && !validateStep2())}
                            >
                                Next
                            </Button>
                        ) : (
                            <Button onClick={handleSubmit} disabled={loading}>
                                {loading ? 'Creating...' : 'Create Case'}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
