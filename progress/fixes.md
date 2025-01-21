# Eslint errors unused vars

Update Your .eslintrc.json

```
{
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "no-unused-vars": "off", // Disable unused variable checks in JavaScript
    "@typescript-eslint/no-unused-vars": "off", // Disable unused variable checks in TypeScript
    "@typescript-eslint/no-empty-interface": "off", // Disable empty interface warnings
    "@typescript-eslint/no-empty-object-type": "off" // Disable empty object type warnings
  },
  "overrides": [
    {
      "files": ["*.tsx", "*.ts"], // Ensure the rules apply to TypeScript files
      "rules": {
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-empty-interface": "off",
        "@typescript-eslint/no-empty-object-type": "off"
      }
    }
  ]
}

```

Those rules disable those errors

-- tsconfig
ensure your tsconfig.json is not enforcing unused variable checks. It should look like this:

```
 
{
  "compilerOptions": {
    // other options...
    "noUnusedLocals": false, // Ensure this is set to false
    "noUnusedParameters": false, // Ensure this is set to false
  }
}

```



-- Run ESLint Again

```
 npx eslint . --ext .ts,.tsx ```



-- To remove items cached in git:

git rm -r --cached node_modules


### Configurin prisma
```
npm install prisma --save-dev
npx prisma init
```
Create a migration after editing the schema.prisma
```
npx prisma migrate dev --name init

```
Generate Prisma Client to interact with the database, prisma client needs to be generated
```

npx prisma generate

```


- Grant user permision to create databases

```
GRANT ALL PRIVILEGES ON *.* TO 'your_user'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;



```



- The error "Cannot use import statement outside a module" indicates that your Node.js environment is not set up to support ES module syntax (i.e., using import and export statements). By default, Node.js uses CommonJS modules. However, you can enable ES module support in your project. Here’s how to do that and ensure everything works correctly.
```

{
  "name": "your-project",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^your_version",
    "@prisma/client": "^your_version"
  },
  "devDependencies": {
    "prisma": "^your_version"
  }
}

```

To add shadcn components

```

npx shadcn@latest add textarea switch select table scroll-area

```

# VENV 
First install python pip

sudo apt install python3-venv

- python3 -m venv myenv
- source myenv/bin/activate

deactivate..to exit env