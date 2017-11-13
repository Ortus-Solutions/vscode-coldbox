import * as vscode from 'vscode';
import * as _ from 'lodash';
import { CompletionDataStore, CompletionInfo } from '../data/CompletionDataStore'
import { runInThisContext } from 'vm';

export class CompletionFactory {
    private static prefixes = _.keys(CompletionDataStore.completions)
        .filter((value, index, array) => {
            return value !== 'all';
        });

    public getCompletions(line?: string): vscode.CompletionItem[] {
        console.log(CompletionFactory.prefixes);
        let prefix = this.findPrefix(line);
        if (prefix === null) {
            return this.getAllCompletions();
        }
        else {
            console.log(prefix);
            return this.getTargetCompletions(prefix);
        }
    }

    private findPrefix(line: string): string {
        if (line === null){
            return null;
        }

        line = line.trim().toLocaleLowerCase();
        if (!_.endsWith(line, '.')) {
            return null;
        }

        line = line.substr(0, line.length - 1);
        for (let prefix of CompletionFactory.prefixes) {
            if (_.endsWith(line, prefix)) {
                return prefix;
            }
        }

        return null;
    }

    private getAllCompletions(): vscode.CompletionItem[] {
        let result = [];
        for (let key in CompletionDataStore.completions) {
            let prefix: string = null;
            if (key !== 'all') {
                result.push(this.createCompletionItem(key));
                prefix = key;
            }

            let items = CompletionDataStore.completions[key];
            for (let item of items) {
                result.push(this.createCompletionItem(item, prefix));
            }
        }

        return result;
    }

    private getTargetCompletions(prefix: string): vscode.CompletionItem[] {
        if (!_.has(CompletionDataStore.completions, prefix)) {
            return null;
        }

        let result = [];
        let items = CompletionDataStore.completions[prefix];
        for (let item of items) {
            result.push(this.createCompletionItem(item, prefix));
        }

        return result;
    }

    private createCompletionItem(data: CompletionInfo | string, prefix?: string): vscode.CompletionItem {
        if (typeof data === 'object') {
            let trigger = _.isEmpty(prefix) ? data.trigger : `${prefix}.${data.trigger}`;
            let item = new vscode.CompletionItem(trigger, vscode.CompletionItemKind.Snippet);
            let snippet = new vscode.SnippetString(data.snippet);
            item.insertText = snippet;
            if (!_.isEmpty(data.doc)) {
                item.documentation = data.doc;
            }

            return item;
        }
        else if (typeof data === 'string') {
            let trigger = _.isEmpty(prefix) ? data : `${prefix}.${data}`;
            let item = new vscode.CompletionItem(trigger, vscode.CompletionItemKind.Text);
            return item;
        }

        return null;
    }
}