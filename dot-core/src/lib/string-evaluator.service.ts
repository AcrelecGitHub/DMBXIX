import { Injectable } from '@angular/core';
import { Symbols } from './enums/symbol.enum';
import { Log } from './logger/log';
import { StringEval } from './models/string-evaluator.model';

@Injectable({
    providedIn: 'root'
})
export class StringEvaluatorService {

    constructor() { }

    private enumSymbols: Array<string> = [];
    private varsList: Array<string> = [];

    loadSimbols() {
        this.enumSymbols = [];
        for (const value in Symbols) {
            if (typeof Symbols[value] === 'string') {
                this.enumSymbols.push(Symbols[value]);
            }
        }
    }

    evaluate(expression: string, generics: StringEval[]): boolean {

        if (!expression) {
            return false;
        }
        expression = expression.toUpperCase();

        generics = this.resetGenerics(generics);

        // other changes to formula (ex multiply)
        expression = this.normalizeExpression(expression);

        // Load variables from expression to StringList
        this.loadVars(expression);

        // Try to convert variables to boolean values
        expression = this.convertVarsToBools(this.varsList, expression, generics);

        // Rename logical operators
        expression = this.renameOperatorsFromSymbolToWord(expression);

        let wordBool = false;
        try {
            // tslint:disable-next-line: no-eval
            wordBool = eval(expression);
        } catch {
            wordBool = false;
        }

        return wordBool;
    }

    loadVars(expression: string) {

        this.varsList = [];

        if (!expression) {
            return;
        }
        this.loadSimbols();

        let lExpression = expression.split(' ').join('');
        this.enumSymbols.forEach((element) => {
            lExpression = lExpression.split(element).join('|');
        });
        while (lExpression.indexOf('||') !== -1) {
            lExpression = lExpression.split('||').join('|');
        }
        if (lExpression[0] === '|') {
            lExpression = lExpression.replace('|', '');
        }
        if (lExpression[lExpression.length - 1] === '|') {
            lExpression = lExpression.slice(0, -1);
        }
        this.varsList = lExpression.split('|');
    }

    convertVarsToBools(varsList: string[], expression: string, generics: StringEval[]): string {

        let lResult = expression;
        if (!varsList) {
            return lResult;
        }
        varsList.forEach((element) => {

            if (element === 'TRUE' || element === 'FALSE') {
                lResult = lResult.split(element).join(element.toLowerCase());
            } else {
                const lFound = generics.find(lObj => {
                    return lObj['name'] === element && lObj['wasUsed'] === false;
                });
                if (lFound) {
                    lResult = lResult.split(element).join((lFound['isEnabled'] === true).toString());
                    lFound['wasUsed'] = true;
                } else {
                    lResult = lResult.split(element).join('false');
                }
            }

        });
        return lResult;
    }

    renameOperatorsFromSymbolToWord(expression: string): string {
        expression = expression.split(Symbols.BracketIn).join(' ( ');
        expression = expression.split(Symbols.BracketIn).join(' ( ');
        expression = expression.split(Symbols.BracketOut).join(' ) ');
        expression = expression.split(Symbols.LogicalAnd).join(' && ');
        expression = expression.split(Symbols.LogicalOr).join(' || ');
        expression = expression.split(Symbols.LogicalNot).join(' ! ');

        return expression;
    }

    replaceMultiplier(aOriginal: string, aString1: string, aString2: string): string {
        let lToMultiply = aString1;
        let lMultiplier = parseInt(aString1, 10);
        if (!isNaN(lMultiplier)) {
            lToMultiply = aString2;
        } else {
            lMultiplier = parseInt(aString2, 10);
        }

        let lExpression = lToMultiply;
        for (let i = 1; i < lMultiplier; i++) {
            lExpression = lExpression + Symbols.LogicalAnd + lToMultiply;
        }
        return aOriginal.replace(aString1 + Symbols.LogicalMultiply + aString2, lExpression);
    }


    // change multiplication to serial &
    // 3 * I333 => I333 & I333 & I333
    normalizeExpression(expression: string): string {
        let lResult = expression.replace(/ /g, '');
        if (lResult === '') {
            return lResult;
        }

        while (lResult.indexOf(Symbols.LogicalMultiply) !== -1) {
            let lVar1 = '';
            let lVar = '';
            let countSymbol: number ;
            for (let i = 0; i < lResult.length; i++) {
                countSymbol = 0;
                this.enumSymbols.forEach((value) => {
                    if (value === lResult[i + 1]) {
                        countSymbol++;
                    }
                });
                if (countSymbol === 0) { // lResult doesn't contains any Symbols
                    lVar = lVar + lResult[i + 1];
                } else {
                    if (lVar === '') {
                        continue;
                    }
                    if (lResult[i + 1] === Symbols.LogicalMultiply) {
                        lVar1 = lVar;
                    } else {
                        if (lVar1 !== '') {
                          break;
                        }
                    }
                    lVar = '';
                }
            }
            if (lVar1 !== '' && lVar !== '') {
                lResult = this.replaceMultiplier(lResult, lVar1, lVar);
            }
        }
        return lResult;
    }

    resetGenerics(lGenerics: StringEval[]): StringEval[] {
        lGenerics.forEach((value) => {
            try {
                if (value.wasUsed) {
                    value.wasUsed = false;
                }
            } catch {
                Log.debug('Cannot reset generics');
            }
        });
        return lGenerics;
    }

    loadConditions(aStr: string): {name: string, value: string}[] {

        const aList = [];
        let k = 1;
        let lStr = aStr;
        let lPos1 = lStr.indexOf('[');
        let lPos2 = lStr.indexOf(']');

        while (lPos1 > -1 && lPos2 > -1) {
            // condition without brackets
            const lCond = lStr.substr(lPos1 + 1, lPos2 - lPos1 - 1);
            const lObj = {name: 'Condition' + String(k), value: lCond};
            aList.push(lObj);
            aStr = aStr.replace('[' + lCond + ']', 'Condition' + String(k));
            k++;

            lStr = lStr.substr(lPos2 + 1);
            lPos1 = lStr.indexOf('[');
            lPos2 = lStr.indexOf(']');
        }
        return aList;
    }

    evaluateCondition(aStr: string, aValues: StringEval[]): boolean {
        let lResult = false;
        try {
            lResult = this.evaluate( aStr, aValues);
        } catch {
            Log.debug('Cannot eveluate condition');
        }
        return lResult;
    }

    evaluateMultiple(expression: string, generics: StringEval[]): boolean {
        let lConditions: {name: string, value: string}[];
        try {
            lConditions = this.loadConditions(expression);
            for (let i = 0; i < lConditions.length; i++) {
                expression = expression.replace(lConditions[i].name, this.evaluateCondition(lConditions[i].value, generics).toString());
            }
            return this.evaluateCondition(expression, generics);
        } catch {
            Log.debug('Cannot evaluate: {0}', expression);
        }
    }
}





