import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertTriangle, Calendar } from 'lucide-react';



// ============================================================================
// MEDICAL ELIGIBILITY SYSTEM - WHO & NBTC COMPLIANT
// ============================================================================

/**
 * Donation Component Types
 */
type DonationComponent = 'Whole Blood' | 'Platelets' | 'Plasma' | 'PRBC';

/**
 * Gender Types
 */
type Gender = 'Male' | 'Female' | 'male' | 'female';

/**
 * Eligibility Result
 */
interface EligibilityResult {
    eligible: boolean;
    nextEligibleDate: Date | null;
    rejectionReason: string | null;
    daysUntilEligible: number;
    canDonateOtherComponents: Array<{
        component: DonationComponent;
        availableDate: Date;
    }>;
}

/**
 * MEDICAL CONSTANTS - DO NOT MODIFY
 * Source: WHO Blood Donor Selection Guidelines & NBTC India Guidelines
 */
const MEDICAL_RULES = {
    // Minimum intervals in DAYS
    INTERVALS: {
        'Whole Blood': {
            Male: 84,      // 12 weeks
            Female: 112    // 16 weeks
        },
        'Platelets': {
            Male: 2,       // 48 hours
            Female: 2      // 48 hours
        },
        'Plasma': {
            Male: 14,      // 2 weeks
            Female: 14     // 2 weeks
        },
        'PRBC': {
            Male: 112,     // 16 weeks
            Female: 112    // 16 weeks
        }
    },

    // Maximum donations per year
    MAX_ANNUAL: {
        'Whole Blood': 4,    // Conservative (India allows 4)
        'Platelets': 24,     // Max 24/year
        'Plasma': 24,        // Max 24/year
        'PRBC': 3            // Conservative
    },

    // Hemoglobin cutoffs (g/dL)
    HEMOGLOBIN: {
        Male: 13.0,
        Female: 12.5
    },

    // Age limits
    AGE: {
        min: 18,
        max: 65
    },

    // Weight minimum (kg)
    WEIGHT_MIN: 50
} as const;

/**
 * Calculate donor eligibility based on medical rules
 * 
 * @param gender - Donor gender
 * @param donationType - Type of donation requested
 * @param lastDonationDate - Date of last donation (any type)
 * @param lastDonationType - Type of last donation
 * @param currentDate - Current date (for testing)
 * @param hemoglobin - Current hemoglobin level (g/dL)
 * @param donationsThisYear - Number of donations of this type in current year
 * @param age - Donor age
 * @param weight - Donor weight (kg)
 * @returns EligibilityResult object
 */
export function calculateDonorEligibility(
    gender: Gender,
    donationType: DonationComponent,
    lastDonationDate: Date | null,
    lastDonationType: DonationComponent | null,
    currentDate: Date = new Date(),
    hemoglobin?: number,
    donationsThisYear?: number,
    age?: number,
    weight?: number
): EligibilityResult {

    const normalizedGender = (gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase()) as 'Male' | 'Female';

    // STEP 1: Check basic eligibility criteria

    // Age check
    if (age !== undefined) {
        if (age < MEDICAL_RULES.AGE.min) {
            return {
                eligible: false,
                nextEligibleDate: null,
                rejectionReason: `Donor must be at least ${MEDICAL_RULES.AGE.min} years old. Current age: ${age} years.`,
                daysUntilEligible: -1,
                canDonateOtherComponents: []
            };
        }
        if (age > MEDICAL_RULES.AGE.max) {
            return {
                eligible: false,
                nextEligibleDate: null,
                rejectionReason: `Donor must be under ${MEDICAL_RULES.AGE.max} years old. Current age: ${age} years.`,
                daysUntilEligible: -1,
                canDonateOtherComponents: []
            };
        }
    }

    // Weight check
    if (weight !== undefined && weight < MEDICAL_RULES.WEIGHT_MIN) {
        return {
            eligible: false,
            nextEligibleDate: null,
            rejectionReason: `Donor must weigh at least ${MEDICAL_RULES.WEIGHT_MIN} kg. Current weight: ${weight} kg.`,
            daysUntilEligible: -1,
            canDonateOtherComponents: []
        };
    }

    // Hemoglobin check
    if (hemoglobin !== undefined) {
        const minHb = MEDICAL_RULES.HEMOGLOBIN[normalizedGender];
        if (hemoglobin < minHb) {
            return {
                eligible: false,
                nextEligibleDate: null,
                rejectionReason: `Hemoglobin too low. Minimum required: ${minHb} g/dL. Current: ${hemoglobin} g/dL. Please consult a physician.`,
                daysUntilEligible: -1,
                canDonateOtherComponents: []
            };
        }
    }

    // STEP 2: Check annual donation limit
    if (donationsThisYear !== undefined) {
        const maxAllowed = MEDICAL_RULES.MAX_ANNUAL[donationType];
        if (donationsThisYear >= maxAllowed) {
            return {
                eligible: false,
                nextEligibleDate: new Date(currentDate.getFullYear() + 1, 0, 1), // Next Jan 1
                rejectionReason: `Annual donation limit reached. Maximum ${maxAllowed} ${donationType} donations per year. You have already donated ${donationsThisYear} times this year.`,
                daysUntilEligible: Math.ceil((new Date(currentDate.getFullYear() + 1, 0, 1).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)),
                canDonateOtherComponents: []
            };
        }
    }

    // STEP 3: First-time donor (no previous donation)
    if (!lastDonationDate || !lastDonationType) {
        return {
            eligible: true,
            nextEligibleDate: currentDate,
            rejectionReason: null,
            daysUntilEligible: 0,
            canDonateOtherComponents: []
        };
    }

    // STEP 4: Calculate interval since last donation
    const daysSinceLastDonation = Math.floor(
        (currentDate.getTime() - lastDonationDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // STEP 5: Determine required interval
    // Conservative approach: Use the LONGER interval if switching types
    const requiredIntervalForRequested = MEDICAL_RULES.INTERVALS[donationType][normalizedGender];
    const requiredIntervalFromLast = MEDICAL_RULES.INTERVALS[lastDonationType][normalizedGender];
    const requiredInterval = Math.max(requiredIntervalForRequested, requiredIntervalFromLast);

    // STEP 6: Check if eligible
    if (daysSinceLastDonation >= requiredInterval) {
        return {
            eligible: true,
            nextEligibleDate: currentDate,
            rejectionReason: null,
            daysUntilEligible: 0,
            canDonateOtherComponents: calculateAlternativeComponents(
                currentDate,
                lastDonationDate,
                lastDonationType,
                donationType,
                normalizedGender
            )
        };
    }

    // STEP 7: Not eligible - calculate next eligible date
    const nextEligibleDate = new Date(lastDonationDate);
    nextEligibleDate.setDate(nextEligibleDate.getDate() + requiredInterval);

    const daysUntilEligible = Math.ceil(
        (nextEligibleDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
        eligible: false,
        nextEligibleDate: nextEligibleDate,
        rejectionReason: `Insufficient recovery period. Last donation: ${lastDonationType} on ${lastDonationDate.toLocaleDateString()}. Required interval: ${requiredInterval} days. Days elapsed: ${daysSinceLastDonation} days.`,
        daysUntilEligible: daysUntilEligible,
        canDonateOtherComponents: calculateAlternativeComponents(
            currentDate,
            lastDonationDate,
            lastDonationType,
            donationType,
            normalizedGender
        )
    };
}

/**
 * Calculate alternative donation components available
 */
function calculateAlternativeComponents(
    currentDate: Date,
    lastDonationDate: Date,
    lastDonationType: DonationComponent,
    requestedType: DonationComponent,
    gender: 'Male' | 'Female'
): Array<{ component: DonationComponent; availableDate: Date }> {
    const alternatives: Array<{ component: DonationComponent; availableDate: Date }> = [];
    const components: DonationComponent[] = ['Whole Blood', 'Platelets', 'Plasma', 'PRBC'];

    for (const component of components) {
        if (component === requestedType) continue;

        const requiredInterval = Math.max(
            MEDICAL_RULES.INTERVALS[component][gender],
            MEDICAL_RULES.INTERVALS[lastDonationType][gender]
        );

        const availableDate = new Date(lastDonationDate);
        availableDate.setDate(availableDate.getDate() + requiredInterval);

        if (availableDate <= currentDate) {
            alternatives.push({ component, availableDate: currentDate });
        } else {
            alternatives.push({ component, availableDate });
        }
    }

    return alternatives.sort((a, b) => a.availableDate.getTime() - b.availableDate.getTime());
}

// ============================================================================
// DEMO COMPONENT
// ============================================================================

export default function MedicalEligibilityDemo() {
    const testCases = [
        {
            name: "First Time Donor",
            gender: "Male" as Gender,
            donationType: "Whole Blood" as DonationComponent,
            lastDonationDate: null,
            lastDonationType: null,
            hemoglobin: 14.5,
            age: 25,
            weight: 70
        },
        {
            name: "Recent Whole Blood Donor (Male)",
            gender: "Male" as Gender,
            donationType: "Whole Blood" as DonationComponent,
            lastDonationDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
            lastDonationType: "Whole Blood" as DonationComponent,
            hemoglobin: 13.5,
            age: 30,
            weight: 75
        },
        {
            name: "Recent Platelet Donor",
            gender: "Female" as Gender,
            donationType: "Platelets" as DonationComponent,
            lastDonationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            lastDonationType: "Platelets" as DonationComponent,
            hemoglobin: 12.8,
            age: 28,
            weight: 55
        },
        {
            name: "Low Hemoglobin",
            gender: "Female" as Gender,
            donationType: "Whole Blood" as DonationComponent,
            lastDonationDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
            lastDonationType: "Whole Blood" as DonationComponent,
            hemoglobin: 11.0,
            age: 35,
            weight: 60
        }
    ];

    return (
        <div className="p-8 space-y-6 bg-[var(--clr-bg-page)] min-h-screen">
            <div className="max-w-6xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Medical Eligibility System - WHO & NBTC Compliant</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Alert className="mb-6">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                This algorithm implements conservative, medically-safe donation intervals as per WHO and India NBTC guidelines.
                                All calculations prioritize donor safety over convenience.
                            </AlertDescription>
                        </Alert>

                        <div className="grid gap-4">
                            {testCases.map((testCase, idx) => {
                                const result = calculateDonorEligibility(
                                    testCase.gender,
                                    testCase.donationType,
                                    testCase.lastDonationDate,
                                    testCase.lastDonationType,
                                    new Date(),
                                    testCase.hemoglobin,
                                    undefined,
                                    testCase.age,
                                    testCase.weight
                                );

                                return (
                                    <Card key={idx} className={result.eligible ? "border-green-300" : "border-red-300"}>
                                        <CardContent className="pt-6">
                                            <div className="flex items-start gap-4">
                                                {result.eligible ? (
                                                    <CheckCircle2 className="w-6 h-6 text-[var(--clr-success)] flex-shrink-0 mt-1" />
                                                ) : (
                                                    <XCircle className="w-6 h-6 text-[var(--clr-emergency)] flex-shrink-0 mt-1" />
                                                )}

                                                <div className="flex-1">
                                                    <h3 className="font-bold text-lg mb-2">{testCase.name}</h3>

                                                    <div className="grid grid-cols-2 gap-2 text-sm mb-3 text-[var(--txt-body)]">
                                                        <div>Gender: <span className="font-semibold">{testCase.gender}</span></div>
                                                        <div>Requested: <span className="font-semibold">{testCase.donationType}</span></div>
                                                        <div>Hemoglobin: <span className="font-semibold">{testCase.hemoglobin} g / dL</span></div>
                                                        <div>Age / Weight: <span className="font-semibold">{testCase.age} yrs / {testCase.weight} kg</span></div>
                                                    </div>

                                                    {result.eligible ? (
                                                        <Alert className="bg-green-50 border-green-300">
                                                            <CheckCircle2 className="h-4 w-4 text-[var(--clr-success)]" />
                                                            <AlertDescription className="text-green-800">
                                                                ✅ <strong>ELIGIBLE</strong> - Donor may proceed with {testCase.donationType} donation.
                                                            </AlertDescription>
                                                        </Alert>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <Alert className="bg-red-50 border-red-300">
                                                                <XCircle className="h-4 w-4 text-[var(--clr-emergency)]" />
                                                                <AlertDescription className="text-red-800">
                                                                    <strong>NOT ELIGIBLE</strong>
                                                                    <div className="mt-2 text-sm">{result.rejectionReason}</div>
                                                                </AlertDescription>
                                                            </Alert>

                                                            {result.nextEligibleDate && (
                                                                <Alert className="bg-blue-50 border-blue-300">
                                                                    <Calendar className="h-4 w-4 text-[var(--clr-info)]" />
                                                                    <AlertDescription className="text-blue-800 text-sm">
                                                                        Next eligible for {testCase.donationType}:
                                                                        <strong> {result.nextEligibleDate.toLocaleDateString()}</strong>
                                                                        {' '}({result.daysUntilEligible} days remaining)
                                                                    </AlertDescription>
                                                                </Alert>
                                                            )}

                                                            {result.canDonateOtherComponents.length > 0 && (
                                                                <Alert className="bg-purple-50 border-purple-300">
                                                                    <AlertDescription className="text-purple-800 text-sm">
                                                                        <strong>Alternative Options:</strong>
                                                                        <ul className="mt-2 space-y-1">
                                                                            {result.canDonateOtherComponents.map((alt, i) => (
                                                                                <li key={i}>
                                                                                    • {alt.component}: {alt.availableDate <= new Date() ? "Available now" : `Available ${alt.availableDate.toLocaleDateString()}`}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </AlertDescription>
                                                                </Alert>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}