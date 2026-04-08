import path from 'path'

let initialized = false;

export default function replacePath() {
  if (initialized) {
    return;
  }
  Object.entries(path).filter(([key, value]) => 
    typeof value === 'function' &&
    !key.startsWith('_')
  ).forEach(([key, value]) => {
      // console.log(`Replacing path.${key}(${(', ').repeat(value.length)})...`);
      path[key] = function (...args) {
        try {
          const result = value.apply(path, args);
          // console.log(`./replacePath.js:${14}`, {args, result, key});
          if (typeof result === 'string') {
            return result.replace(/\\/g, '/').replace(/\/\/+/g, '/');
          }
          return result;
        } catch (err) {
          let txt='[...]';
          try {
            txt = JSON.stringify(args);
          } catch (err) {
            // ignore
          }
          console.log(`Error executing path.${key}(${txt.substring(1, txt.length-1)}):`, err.message);
          throw err;
        }
    }
  });
  initialized = true;
}