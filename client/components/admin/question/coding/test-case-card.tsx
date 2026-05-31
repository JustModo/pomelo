"use client";

import { useRef } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from "@/components/ui/card";
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Beaker, Plus, Trash2, Code2, Download, Upload } from "lucide-react";

const SUPPORTED_TYPES = [
    "int",
    "float",
    "char",
    "string",
    "int_array",
    "float_array",
    "string_array",
];

export default function TestCaseCard() {
    const { control, watch } = useFormContext();
    const fileRef = useRef<HTMLInputElement>(null);

    const {
        fields: variableFields,
        append: appendVariable,
        remove: removeVariable,
    } = useFieldArray({
        control,
        name: "inputVariables",
    });

    const {
        fields: testCaseFields,
        append: appendTestCase,
        remove: removeTestCase,
    } = useFieldArray({
        control,
        name: "testCases",
    });

    const inputVariables = watch("inputVariables") || [];

    const hasDuplicateVariables = inputVariables.some((v: { variable: string }, i: number) => {
        const trimmed = v.variable?.trim();
        return trimmed && inputVariables.findIndex((v2: { variable: string }) => v2.variable?.trim() === trimmed) !== i;
    });
    
    const isMissingNames = inputVariables.some((v: { variable: string }) => !v.variable?.trim());
    const isVariableInvalid = isMissingNames || hasDuplicateVariables;

    const handleDownloadTemplate = () => {
        if (!inputVariables || inputVariables.length === 0) return;
        const headers = ["isVisible", "output", ...inputVariables.map((v: {variable: string}) => v.variable)];
        const exampleRow = ["FALSE", "Expected Output", ...inputVariables.map((v: {variable: string}) => `Value for ${v.variable}`)];
        const csvContent = headers.join(",") + "\n" + exampleRow.join(",");
        
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "testcases_template.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleUploadCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const lines = text.trim().split('\n');
            if (lines.length < 2) {
                alert("CSV must have a header row and at least one data row");
                return;
            }

            const parseCSVLine = (line: string): string[] => {
                const result: string[] = [];
                let current = '';
                let inQuotes = false;

                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    if (char === '"') {
                        if (inQuotes && line[i + 1] === '"') {
                            current += '"';
                            i++;
                        } else {
                            inQuotes = !inQuotes;
                        }
                    } else if (char === ',' && !inQuotes) {
                        result.push(current);
                        current = '';
                    } else {
                        current += char;
                    }
                }
                result.push(current);
                return result;
            };

            const expectedHeaders = ["isVisible", "output", ...inputVariables.map((v: {variable: string}) => v.variable)];
            const headers = parseCSVLine(lines[0]).map(h => h.trim());

            // Validate headers
            const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
            if (missingHeaders.length > 0) {
                alert(`CSV is missing required columns: ${missingHeaders.join(', ')}`);
                if (fileRef.current) fileRef.current.value = "";
                return;
            }

            const newTestCases = [];

            for (let i = 1; i < lines.length; i++) {
                const values = parseCSVLine(lines[i]);
                if (values.length === 1 && !values[0].trim()) continue; // skip empty lines
                
                if (values.length < headers.length) {
                    alert(`Row ${i + 1} has missing columns. Expected ${headers.length}, got ${values.length}.`);
                    if (fileRef.current) fileRef.current.value = "";
                    return;
                }
                
                const rowData: Record<string, string> = {};
                headers.forEach((h, idx) => {
                    rowData[h] = values[idx] || '';
                });

                const inputData: Record<string, any> = {};
                inputVariables.forEach((v: {variable: string}) => {
                    inputData[v.variable] = rowData[v.variable] || '';
                });

                newTestCases.push({
                    isVisible: rowData['isVisible']?.toUpperCase() === 'TRUE',
                    output: rowData['output'] || '',
                    input: inputData
                });
            }

            newTestCases.forEach(tc => appendTestCase(tc));
            
        } catch (error) {
            console.error("Failed to parse CSV", error);
            alert("Failed to parse CSV file");
        }
        
        if (fileRef.current) {
            fileRef.current.value = "";
        }
    };

    return (
        <div className="space-y-6">
            {/* Function Signature Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Code2 className="h-5 w-5 text-primary" />
                        Function Signature
                    </CardTitle>
                    <CardDescription>
                        Define the function name and input parameters.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                        control={control}
                        name="functionName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Function Name</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="e.g. solve" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <FormLabel className="text-base">Input Variables</FormLabel>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => appendVariable({ variable: "", type: "int" })}
                                disabled={testCaseFields.length > 0}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Variable
                            </Button>
                        </div>

                        {variableFields.map((field, index) => (
                            <div key={field.id} className="flex items-start gap-4">
                                <FormField
                                    control={control}
                                    name={`inputVariables.${index}.variable`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input {...field} placeholder="Variable Name" disabled={testCaseFields.length > 0} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={control}
                                    name={`inputVariables.${index}.type`}
                                    render={({ field }) => (
                                        <FormItem className="w-[180px]">
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                disabled={testCaseFields.length > 0}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {SUPPORTED_TYPES.map((type) => (
                                                        <SelectItem key={type} value={type}>
                                                            {type}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive"
                                    onClick={() => removeVariable(index)}
                                    disabled={testCaseFields.length > 0}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        {variableFields.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                                No input variables defined.
                            </p>
                        )}
                        {hasDuplicateVariables && (
                            <p className="text-sm text-destructive mt-2 font-medium">
                                Duplicate variable names are not allowed.
                            </p>
                        )}
                    </div>
                    {testCaseFields.length > 0 && (
                        <p className="text-sm text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 p-2 rounded border border-yellow-200 dark:border-yellow-800">
                            ⚠️ Clear test cases to modify input variables.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Test Cases Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Beaker className="h-5 w-5 text-primary" />
                        Test Cases
                    </CardTitle>
                    <CardDescription>
                        Add test cases based on the defined input variables.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {(!inputVariables || inputVariables.length === 0) ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Define input variables above to add test cases.
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-end gap-2 items-center flex-wrap">
                                {isMissingNames && (
                                    <span className="text-xs text-destructive">
                                        Name all variables to add test cases
                                    </span>
                                )}
                                
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDownloadTemplate}
                                    disabled={isVariableInvalid}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Template
                                </Button>
                                
                                <input
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    ref={fileRef}
                                    onChange={handleUploadCSV}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileRef.current?.click()}
                                    disabled={isVariableInvalid}
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Import CSV
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => appendTestCase({ input: {}, output: "", isVisible: false })}
                                    disabled={isVariableInvalid}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Test Case
                                </Button>
                            </div>

                            <div className="space-y-6">
                                {testCaseFields.map((field, index) => (
                                    <div
                                        key={field.id}
                                        className="p-4 border rounded-lg space-y-4 bg-muted/30"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <h4 className="font-medium text-sm">Test Case {index + 1}</h4>
                                                <FormField
                                                    control={control}
                                                    name={`testCases.${index}.isVisible`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                            <FormControl>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={field.value}
                                                                    onChange={field.onChange}
                                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="text-xs font-normal cursor-pointer">
                                                                Visible to User
                                                            </FormLabel>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive"
                                                onClick={() => removeTestCase(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Inputs Generation */}
                                            <div className="space-y-3 p-3 bg-background/50 rounded-md border">
                                                <span className="text-xs font-semibold uppercase text-muted-foreground">Input</span>
                                                {inputVariables.map((variable: { variable: string; type: string }, vIndex: number) => (
                                                    <FormField
                                                        key={`${field.id}-input-${vIndex}`}
                                                        control={control}
                                                        name={`testCases.${index}.input.${variable.variable}`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-xs">{variable.variable} <span className="text-muted-foreground font-normal">({variable.type})</span></FormLabel>
                                                                <FormControl>
                                                                    <Input {...field} value={field.value ?? ""} placeholder={`Value for ${variable.variable}`} className="h-8 text-sm" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                ))}
                                            </div>

                                            {/* Output */}
                                            <div className="space-y-3 p-3 bg-background/50 rounded-md border">
                                                <span className="text-xs font-semibold uppercase text-muted-foreground">Expected Output</span>
                                                <FormField
                                                    control={control}
                                                    name={`testCases.${index}.output`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Textarea
                                                                    {...field}
                                                                    placeholder="Expected output"
                                                                    className="min-h-[100px] resize-none font-mono text-sm"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {testCaseFields.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                                        No test cases added.
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div >
    );
}
