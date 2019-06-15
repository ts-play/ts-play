declare var ts: typeof import ('typescript');
type CompilerOptions = import ('typescript').CompilerOptions;

type ThrottleState = 'idle' | 'cooldown' | 'pending';
const throttle = <T extends Array<any>>(
    fn: (...args: T) => void,
    threshold: number = 200): ((...args: T) => void) => {
        let toHandle: number | null = null;
        let state: ThrottleState = 'idle';
        let pendingArgs: T = null;

        const relax = () => {
            if (state === 'cooldown') {
                state = 'idle';
                clearInterval(toHandle);
            } else if (state === 'pending') {
                state = 'cooldown';
                fn.apply(null, pendingArgs);
                pendingArgs = null;
            }
        };

        return (...args: T) => {
            if (state === 'idle') {
                toHandle = setInterval(relax, threshold);
                state = 'cooldown';
                fn.apply(null, args);
            } else {
                pendingArgs = args;
                state = 'pending';
            }
        };
    };

const compile = (code: string, options: CompilerOptions): string => {
    const inputFileName = 'input.ts';
    const sourceFile = ts.createSourceFile(inputFileName, code, ts.ScriptTarget.ES5);

    let outputText;
    const program = ts.createProgram([inputFileName], options, {
        directoryExists: () => true,
        fileExists: (fileName) => fileName === inputFileName,
        getCanonicalFileName: (fileName) => fileName,
        getCurrentDirectory: () => '',
        getDefaultLibFileName: () => 'lib.d.ts',
        getDirectories: () => [],
        getNewLine: () => '\n',
        getSourceFile: (fileName) => fileName === inputFileName ? sourceFile : undefined,
        readFile: () => '',
        useCaseSensitiveFileNames: () => false,
        writeFile: (name, text) => outputText = text,
    });
    program.emit();

    if (outputText === undefined) {
        throw new Error('Could not compile source');
    }
    return outputText;
};

const input = document.getElementById('input') as HTMLTextAreaElement;
const output = document.getElementById('output') as HTMLTextAreaElement;

let sourceCode = '';
const triggerCompile = throttle(() => {
    output.value = compile(sourceCode, {});
});

const sourceUpdated = () => {
    const newCode = input.value;
    if (newCode === sourceCode) { return; }
    sourceCode = newCode;
    triggerCompile();
};

input.addEventListener('input', sourceUpdated);
input.addEventListener('change', sourceUpdated);
sourceUpdated();
