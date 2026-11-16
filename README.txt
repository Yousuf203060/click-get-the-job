SETUP (one time)
1. Create a free GitHub account + a new repo; upload ALL files of this folder.
2. Open admin/config.yml and set repo: yourusername/yourrepo
3. Netlify > Add new site > Import from GitHub > select the repo. (Build settings are read from netlify.toml)
4. Netlify > Site configuration > Access & security > OAuth > Install provider > GitHub (add Client ID/Secret from GitHub > Settings > Developer settings > OAuth Apps; callback URL: https://api.netlify.com/auth/done)
5. Netlify > Environment variables: CONTACT_EMAIL = your email (later ADSENSE_CLIENT = ca-pub-xxxxxxxx after AdSense approval)
6. Admin panel: https://YOURSITE.netlify.app/admin -> Login with GitHub -> New Job -> Publish. Site updates in ~1 minute.
