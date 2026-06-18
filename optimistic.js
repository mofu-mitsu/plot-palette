const fs = require('fs');

const path = 'client/src/App.tsx';
let content = fs.readFileSync(path, 'utf-8');

function makeOptimistic(funcName) {
  // `try {` の前に、 `catch (err) {` の中にあるオフラインステート更新ロジックを移動する
  // まず try と catch を見つける
  const funcRegex = new RegExp(`const ${funcName} = async \\(e: React\\.FormEvent\\) => \\{[\\s\\S]*?catch \\(err\\) \\{[\\s\\S]*?\\}\\s*finally \\{`, 'g');
  
  content = content.replace(funcRegex, (match) => {
    // try ブロックと catch ブロックを抽出
    const tryMatch = match.match(/([\s\S]*?)(try\s*\{)([\s\S]*?)(?=\} catch)/);
    if (!tryMatch) return match;

    const prefix = tryMatch[1]; // try の前まで (payload等)
    const tryStart = tryMatch[2]; // try {
    const tryContent = tryMatch[3]; // try の中身

    // catch ブロックを探す
    const catchRegex = /\} catch \(err\) \{([\s\S]*?)\}\s*finally \{/;
    const catchMatch = match.match(catchRegex);
    if (!catchMatch) return match;

    let catchContent = catchMatch[1];

    // catchContent にある console.warn を削除
    catchContent = catchContent.replace(/console\.warn\(.*?\);/g, '');
    // setSyncStatus("offline") を削除 (同期中はsavingなので)
    catchContent = catchContent.replace(/setSyncStatus\(.*?\);/g, '');

    // catchContent の中で setObj(obj.map(...)) になっている部分を setObj(prev => prev.map(...)) に変更
    const stateSetRegex = /set([A-Z][a-zA-Z0-9_]*)\(([\s\S]*?)\);/g;
    catchContent = catchContent.replace(stateSetRegex, (m, stateName, innerArgs) => {
      // innerArgs が `characters.map` なら `prev => prev.map` にする
      const innerStr = innerArgs.trim();
      const lowerName = stateName.toLowerCase();
      // "characters.map" "plots.map" "memos.map" など
      if (innerStr.includes('.map')) {
        return `set${stateName}(prev => prev.map${innerStr.substring(innerStr.indexOf('.map') + 4)});`;
      } 
      if (innerStr.startsWith('[...') && innerStr.endsWith(']')) {
        // "[...characters, offlineChar]"
        const parts = innerStr.substring(4, innerStr.length - 1).split(',');
        const added = parts[1].trim();
        return `set${stateName}(prev => [...prev, ${added}]);`;
      }
      return m;
    });

    // tryContent の中の setObj も prev => を使うように変更できれば最高だが…実は不要かも。
    // APIが返ってきたら、tempId のものを更新する必要がある
    let newTryContent = tryContent.replace(stateSetRegex, (m, stateName, innerArgs) => {
      const innerStr = innerArgs.trim();
      if (innerStr.includes('.map')) {
        // e.g. setCharacters(characters.map((c) => (c.id === editingChar.id ? updated : c)));
        // ここを prev => ... に変える
        return `set${stateName}(prev => prev.map${innerStr.substring(innerStr.indexOf('.map') + 4)});`;
      }
      if (innerStr.startsWith('[...')) {
        const parts = innerStr.substring(4, innerStr.length - 1).split(',');
        const added = parts[1].trim();
        // createの場合、tempId のものを置換する。しかしtempId をキャプチャしなければならないので
        // setCharacters(prev => prev.map(c => c.id === offlineId ? created : c));
        // という文字列に変更したい。オフライン生成のID変数名を探す。
        const idVarMatch = catchContent.match(/const\s+([a-zA-Z0-9]+)\s*=\s*editing[A-Z]/);
        const idVar = idVarMatch ? idVarMatch[1] : 'offlineId';
        return `set${stateName}(prev => prev.map((c: any) => c.id === ${idVar} ? ${added} : c));`;
      }
      return m;
    });
    
    // try の最後に元の setShowXXXModal(false) がある場合は削除
    newTryContent = newTryContent.replace(/setShow[A-Z][a-zA-Z0-9_]*Modal\(false\);/g, '');

    // 結合
    let replacement = `${prefix}
    // ------ Optimistic Update ------
    ${catchContent}
    // --------------------------------
    ${tryStart}
        ${newTryContent}
    } catch (err) {
        console.warn("API Error, relying on local optimistic update", err);
        setSyncStatus("offline");
    } finally {`;
    
    return replacement;
  });
}

['handleCreateOrUpdatePlot', 'handleCreateOrUpdateCharacter', 'handleCreateOrUpdateSetting', 'handleCreateOrUpdateMemo'].forEach(makeOptimistic);

fs.writeFileSync(path, content, 'utf-8');
console.log('Optimistic UI refactor completed for core methods.');
