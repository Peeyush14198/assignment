'use client';

import { useState, useTransition } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { createCase } from '../lib/api';

export function CreateCasePanel() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [loanId, setLoanId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleOpen = () => {
    setErrorMessage(null);
    setIsOpen((prev) => !prev);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const parsedCustomerId = Number(customerId);
    const parsedLoanId = Number(loanId);

    if (
      !Number.isInteger(parsedCustomerId) ||
      parsedCustomerId < 1 ||
      !Number.isInteger(parsedLoanId) ||
      parsedLoanId < 1
    ) {
      setErrorMessage('Customer ID and Loan ID must be positive whole numbers.');
      return;
    }

    startTransition(async () => {
      try {
        const createdCase = await createCase({
          customerId: parsedCustomerId,
          loanId: parsedLoanId
        });

        setCustomerId('');
        setLoanId('');
        setIsOpen(false);
        router.push(`/cases/${createdCase.id}`);
        router.refresh();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to create case.');
      }
    });
  };

  return (
    <div className="create-case-wrapper">
      <button
        type="button"
        className="primary-btn create-case-toggle"
        onClick={toggleOpen}
        aria-expanded={isOpen}
      >
        {isOpen ? 'Close' : 'Add Case'}
      </button>

      {isOpen ? (
        <form className="create-case-form" onSubmit={handleSubmit}>
          <label>
            Customer ID
            <input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              placeholder="e.g. 12"
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
            />
          </label>

          <label>
            Loan ID
            <input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              placeholder="e.g. 77"
              value={loanId}
              onChange={(event) => setLoanId(event.target.value)}
            />
          </label>

          <div className="create-case-actions">
            <button type="submit" className="primary-btn" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create'}
            </button>
            <button type="button" className="secondary-btn" onClick={toggleOpen} disabled={isPending}>
              Cancel
            </button>
          </div>

          {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
