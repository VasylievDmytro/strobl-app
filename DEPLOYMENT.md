# Strobl App Deployment Manual

Этот файл нужен как быстрый мануал для копирования изменений в GitHub и на интернет-сервер.

## Данные проекта

- Локальная папка проекта: `C:\Users\DB-User\Documents\Codex\Strobl`
- GitHub repository: `https://github.com/VasylievDmytro/strobl-app.git`
- Сервер: `root@178.104.239.33`
- Папка приложения на сервере: `/var/www/strobl`
- Домен: `https://www.strobl-app.de`

## 1. Проверить локальную сборку

В PowerShell на компьютере:

```powershell
cd C:\Users\DB-User\Documents\Codex\Strobl
npm.cmd run build
```

Если сборка прошла без ошибок, можно отправлять изменения.

## 2. Отправить изменения на GitHub

```powershell
cd C:\Users\DB-User\Documents\Codex\Strobl
git status
git add .
git commit -m "Update Strobl app"
git push
```

Если `git commit` пишет `nothing to commit, working tree clean`, значит изменения уже были сохранены.

Если `git push` пишет `Everything up-to-date`, значит GitHub уже обновлен.

## 3. Скопировать изменения на сервер

В PowerShell на компьютере:

```powershell
cd C:\Users\DB-User\Documents\Codex\Strobl
scp -r .\app .\components .\features .\lib .\types root@178.104.239.33:/var/www/strobl/
scp .\package.json .\package-lock.json .\next.config.ts .\tsconfig.json .\tailwind.config.ts .\postcss.config.js .\middleware.ts root@178.104.239.33:/var/www/strobl/
```

Если сервер спросит:

```text
Are you sure you want to continue connecting?
```

ответить:

```text
yes
```

Если сервер спросит пароль, ввести пароль от сервера. При вводе пароля символы не показываются.

## 4. Собрать и перезапустить приложение на сервере

Зайти на сервер:

```powershell
ssh root@178.104.239.33
```

На сервере выполнить:

```bash
cd /var/www/strobl
npm install
npm run build
pm2 list
```

Посмотреть имя процесса в `pm2 list`, затем перезапустить его.

Чаще всего:

```bash
pm2 restart strobl
```

Если процесс называется `strobl-app`, тогда:

```bash
pm2 restart strobl-app
```

Выйти с сервера:

```bash
exit
```

## 5. Проверить сайт

Открыть:

```text
https://www.strobl-app.de
```

Если нужно проверить конкретную страницу:

```text
https://www.strobl-app.de/tagesbericht
https://www.strobl-app.de/transportbericht
https://www.strobl-app.de/smapone
https://www.strobl-app.de/baustellen
```

## Важное про `.env.local`

Файл `.env.local` не отправляется в GitHub. Если менялись переменные окружения, их нужно отдельно обновить на сервере:

```powershell
scp .\.env.local root@178.104.239.33:/var/www/strobl/.env.local
```

Делать это только если точно нужно обновить настройки или секреты на сервере.

