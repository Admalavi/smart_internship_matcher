/** Pure data generators for the seed script (no DB access) so they can be unit-tested. */

const mulberry32 = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const rnd = mulberry32(2026);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const between = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const shuffle = (arr) => arr.map((v) => [rnd(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
const IMP = { H: 'High', M: 'Medium', L: 'Low' };
const parseReq = (s) => s.split(',').map((x) => { const [name, i] = x.trim().split(':'); return { name: name.trim(), importance: IMP[i] || 'Medium' }; });
const list = (s) => (s ? s.split(',').map((x) => x.trim()) : []);

/* ------------------------------ SKILL CATALOG ------------------------------ */
const CATALOG = {
  Languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C++', 'Kotlin', 'Dart', 'Swift', 'Bash', 'R'],
  Frontend: ['React', 'Angular', 'Vue.js', 'Next.js', 'HTML', 'CSS', 'Tailwind CSS', 'Bootstrap', 'Redux'],
  Backend: ['Node.js', 'Express.js', 'Spring Boot', 'Hibernate', 'Django', 'Flask', 'FastAPI', 'REST APIs', 'Microservices'],
  Database: ['MongoDB', 'MySQL', 'PostgreSQL', 'SQL', 'Redis', 'Firebase', 'Data Modeling'],
  'Data & AI': ['Machine Learning', 'Deep Learning', 'Data Science', 'NLP', 'Computer Vision', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'Statistics', 'Data Visualization', 'Power BI', 'Tableau', 'Excel', 'Apache Spark', 'OpenCV'],
  'Cloud & DevOps': ['Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Terraform', 'CI/CD', 'Jenkins', 'GitHub Actions', 'Linux', 'Git', 'Monitoring', 'Networking', 'Helm', 'PowerShell'],
  Security: ['Cybersecurity', 'Network Security', 'Penetration Testing', 'OWASP', 'Kali Linux', 'SIEM', 'Burp Suite'],
  Design: ['UI/UX', 'Figma', 'Adobe XD', 'Wireframing', 'Prototyping', 'User Research', 'Usability Testing', 'Illustration', 'Motion Design'],
  Mobile: ['Flutter', 'React Native', 'Android', 'iOS', 'Jetpack Compose', 'SwiftUI'],
  'Computer Science': ['Data Structures', 'Algorithms', 'JUnit', 'Maven', 'Swagger', 'Postman'],
};
const SKILL_CATALOG = Object.entries(CATALOG).flatMap(([category, names]) => names.map((name) => ({ name, category })));
const categoryOf = (n) => (SKILL_CATALOG.find((s) => s.name.toLowerCase() === n.toLowerCase()) || { category: 'General' }).category;

/* ------------------------------ LEARNING PATHS ------------------------------ */
const L = (skill, steps, resources, estimatedHours) => ({ skill, steps, resources: resources.map(([title, url, type]) => ({ title, url, type })), estimatedHours });
const LEARNING = [
  L('Spring Boot', ['Spring Boot basics & project setup', 'REST APIs with Spring MVC', 'Spring Data MongoDB / JPA', 'Spring Security & JWT', 'Build a complete REST API project'], [['Spring Guides', 'https://spring.io/guides', 'docs'], ['Spring Boot Reference', 'https://docs.spring.io/spring-boot/index.html', 'docs']], 40),
  L('Docker', ['Containers vs VMs', 'Write a Dockerfile', 'Docker Compose for multi-service apps', 'Volumes & networking', 'Containerise one of your own projects'], [['Docker Get Started', 'https://docs.docker.com/get-started/', 'docs']], 14),
  L('Kubernetes', ['Pods, Deployments, Services', 'ConfigMaps & Secrets', 'Deploy an app on minikube', 'Ingress & scaling'], [['Kubernetes Tutorials', 'https://kubernetes.io/docs/tutorials/', 'docs']], 30),
  L('AWS', ['IAM & core concepts', 'EC2, S3 and RDS', 'Deploy a web app', 'CloudWatch basics', 'Cloud Practitioner exam prep'], [['AWS Documentation', 'https://docs.aws.amazon.com/', 'docs'], ['AWS Skill Builder', 'https://skillbuilder.aws/', 'course']], 35),
  L('Azure', ['Azure fundamentals', 'VMs, Storage, App Service', 'Azure DevOps basics', 'AZ-900 exam prep'], [['Microsoft Learn - Azure', 'https://learn.microsoft.com/training/azure/', 'course']], 30),
  L('GCP', ['GCP fundamentals', 'Compute Engine & Cloud Storage', 'Cloud Run deployments', 'IAM basics'], [['Google Cloud Docs', 'https://cloud.google.com/docs', 'docs']], 28),
  L('React', ['JSX, components and props', 'State & hooks', 'Routing with React Router', 'Data fetching', 'Build a small app'], [['React Learn', 'https://react.dev/learn', 'docs']], 30),
  L('Node.js', ['Event loop & modules', 'Build an HTTP server', 'Express routing & middleware', 'Connect a database', 'Authentication'], [['Node.js Learn', 'https://nodejs.org/en/learn', 'docs']], 25),
  L('Express.js', ['Routing & middleware', 'Error handling', 'REST API structure', 'JWT authentication'], [['Express Guide', 'https://expressjs.com/en/starter/installing.html', 'docs']], 12),
  L('MongoDB', ['Documents & collections', 'CRUD & query operators', 'Indexes', 'Aggregation pipeline', 'Schema design (embed vs reference)'], [['MongoDB Manual', 'https://www.mongodb.com/docs/manual/', 'docs'], ['MongoDB University', 'https://learn.mongodb.com/', 'course']], 20),
  L('TypeScript', ['Types & interfaces', 'Generics', 'Type narrowing', 'Migrate a JS project'], [['TypeScript Docs', 'https://www.typescriptlang.org/docs/', 'docs']], 15),
  L('JavaScript', ['Core language & ES6+', 'Async/await & promises', 'DOM manipulation', 'Modules & tooling'], [['MDN JavaScript Guide', 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript', 'docs']], 30),
  L('Java', ['Syntax & OOP', 'Collections & generics', 'Streams & lambdas', 'JDBC / JPA', 'Build a console + REST project'], [['Dev.java Learn', 'https://dev.java/learn/', 'docs']], 45),
  L('Python', ['Syntax & data structures', 'Functions & modules', 'File I/O and exceptions', 'Virtual environments & packages', 'Build a small project'], [['Python Tutorial', 'https://docs.python.org/3/tutorial/', 'docs']], 30),
  L('Machine Learning', ['Supervised vs unsupervised learning', 'Regression & classification', 'Model evaluation', 'Scikit-learn pipelines', 'End-to-end project'], [['Scikit-learn User Guide', 'https://scikit-learn.org/stable/user_guide.html', 'docs']], 50),
  L('Deep Learning', ['Neural network fundamentals', 'CNNs', 'RNNs & transformers overview', 'Train a model with TensorFlow or PyTorch'], [['TensorFlow Tutorials', 'https://www.tensorflow.org/tutorials', 'docs'], ['PyTorch Tutorials', 'https://pytorch.org/tutorials/', 'docs']], 50),
  L('TensorFlow', ['Tensors & Keras API', 'Build & train a model', 'Save and serve models'], [['TensorFlow Tutorials', 'https://www.tensorflow.org/tutorials', 'docs']], 25),
  L('PyTorch', ['Tensors & autograd', 'nn.Module', 'Training loops', 'Fine-tune a pretrained model'], [['PyTorch Tutorials', 'https://pytorch.org/tutorials/', 'docs']], 25),
  L('Pandas', ['Series & DataFrames', 'Cleaning & transforming data', 'Group-by & merges', 'Exploratory analysis project'], [['Pandas Getting Started', 'https://pandas.pydata.org/docs/getting_started/', 'docs']], 18),
  L('NumPy', ['Arrays & broadcasting', 'Vectorised operations', 'Linear algebra basics'], [['NumPy Quickstart', 'https://numpy.org/doc/stable/user/quickstart.html', 'docs']], 10),
  L('Scikit-learn', ['Estimators & pipelines', 'Cross-validation', 'Hyper-parameter tuning'], [['Scikit-learn User Guide', 'https://scikit-learn.org/stable/user_guide.html', 'docs']], 15),
  L('NLP', ['Text preprocessing', 'Embeddings', 'Text classification', 'Transformers intro'], [['spaCy 101', 'https://spacy.io/usage/spacy-101', 'docs']], 35),
  L('SQL', ['SELECT, WHERE, ORDER BY', 'Joins', 'Aggregation & GROUP BY', 'Subqueries & window functions'], [['SQLBolt', 'https://sqlbolt.com/', 'interactive']], 15),
  L('Django', ['Project & app structure', 'Models & ORM', 'Views, templates', 'Django REST framework'], [['Django Tutorial', 'https://docs.djangoproject.com/en/stable/intro/tutorial01/', 'docs']], 28),
  L('Flask', ['Routing & templates', 'Blueprints', 'SQLAlchemy', 'Build a REST API'], [['Flask Tutorial', 'https://flask.palletsprojects.com/en/stable/tutorial/', 'docs']], 15),
  L('REST APIs', ['HTTP methods & status codes', 'Resource design', 'Authentication', 'Documenting with Swagger/OpenAPI'], [['MDN HTTP Guide', 'https://developer.mozilla.org/en-US/docs/Web/HTTP', 'docs']], 10),
  L('Git', ['Commits, branches, merges', 'Rebasing & conflict resolution', 'Pull-request workflow'], [['Pro Git Book', 'https://git-scm.com/book/en/v2', 'book']], 8),
  L('CI/CD', ['Pipelines concepts', 'Build & test automation', 'Deploy automatically', 'Add a pipeline to your project'], [['GitHub Actions Docs', 'https://docs.github.com/en/actions', 'docs']], 14),
  L('GitHub Actions', ['Workflow syntax', 'Matrix builds', 'Secrets & deployments'], [['GitHub Actions Docs', 'https://docs.github.com/en/actions', 'docs']], 8),
  L('Jenkins', ['Install Jenkins', 'Freestyle & pipeline jobs', 'Jenkinsfile', 'Integrate with Git & Docker'], [['Jenkins Docs', 'https://www.jenkins.io/doc/', 'docs']], 14),
  L('Terraform', ['IaC concepts', 'Providers & resources', 'State & modules', 'Provision a small AWS stack'], [['Terraform Tutorials', 'https://developer.hashicorp.com/terraform/tutorials', 'docs']], 20),
  L('Linux', ['Shell navigation', 'Permissions & processes', 'Package management', 'Bash scripting'], [['Linux Journey', 'https://linuxjourney.com/', 'interactive']], 18),
  L('Figma', ['Frames, auto-layout', 'Components & variants', 'Prototyping', 'Design a mobile app flow'], [['Figma Help Center', 'https://help.figma.com/', 'docs']], 15),
  L('UI/UX', ['Design principles', 'User flows & wireframes', 'Visual hierarchy & typography', 'Usability heuristics', 'Case study portfolio'], [['Nielsen Norman Group', 'https://www.nngroup.com/articles/', 'articles']], 40),
  L('Flutter', ['Dart basics', 'Widgets & layouts', 'State management', 'Networking & Firebase'], [['Flutter Learn', 'https://flutter.dev/learn', 'docs']], 40),
  L('React Native', ['Core components', 'Navigation', 'State & APIs', 'Publish with Expo'], [['React Native Docs', 'https://reactnative.dev/docs/getting-started', 'docs']], 35),
  L('Kotlin', ['Kotlin syntax', 'Null safety & collections', 'Coroutines', 'Android app basics'], [['Kotlin Docs', 'https://kotlinlang.org/docs/getting-started.html', 'docs']], 30),
  L('Cybersecurity', ['CIA triad & threat models', 'Network fundamentals', 'Common attacks', 'Hands-on labs'], [['OWASP Top Ten', 'https://owasp.org/www-project-top-ten/', 'docs']], 40),
  L('OWASP', ['OWASP Top 10', 'Injection & XSS', 'Authentication flaws', 'Secure coding practice'], [['OWASP Top Ten', 'https://owasp.org/www-project-top-ten/', 'docs']], 20),
  L('Penetration Testing', ['Recon & scanning', 'Exploitation basics', 'Web app testing', 'Reporting'], [['OWASP Testing Guide', 'https://owasp.org/www-project-web-security-testing-guide/', 'docs']], 45),
  L('Tailwind CSS', ['Utility-first concepts', 'Responsive design', 'Dark mode & theming'], [['Tailwind Docs', 'https://tailwindcss.com/docs', 'docs']], 8),
  L('Next.js', ['Routing & layouts', 'Data fetching', 'API routes', 'Deploy a full-stack app'], [['Next.js Learn', 'https://nextjs.org/learn', 'course']], 20),
  L('Power BI', ['Import & model data', 'DAX basics', 'Build dashboards', 'Publish reports'], [['Power BI Docs', 'https://learn.microsoft.com/power-bi/', 'docs']], 18),
  L('Hibernate', ['ORM concepts', 'Entity mapping', 'Relationships & queries', 'Transactions'], [['Hibernate Docs', 'https://hibernate.org/orm/documentation/', 'docs']], 15),
];

/* ------------------------------ COMPANIES ------------------------------ */
const COMPANIES = [
  { name: 'ABC Technologies', email: 'company@example.com', industry: 'IT Services', location: 'Pune', size: '501-1000' },
  { name: 'NimbusSoft', email: 'company2@example.com', industry: 'SaaS', location: 'Bangalore', size: '201-500' },
  { name: 'DataNest Analytics', email: 'company3@example.com', industry: 'Analytics', location: 'Hyderabad', size: '51-200' },
  { name: 'CloudCrest', email: 'company4@example.com', industry: 'Cloud Services', location: 'Mumbai', size: '201-500' },
  { name: 'PixelForge Studio', email: 'company5@example.com', industry: 'Design & Media', location: 'Delhi', size: '11-50' },
  { name: 'SecureGrid', email: 'company6@example.com', industry: 'Cybersecurity', location: 'Noida', size: '51-200' },
  { name: 'Quantum AI Labs', email: 'company7@example.com', industry: 'Artificial Intelligence', location: 'Bangalore', size: '51-200' },
  { name: 'AppWave', email: 'company8@example.com', industry: 'Mobile Apps', location: 'Chennai', size: '51-200' },
  { name: 'FinEdge Systems', email: 'company9@example.com', industry: 'FinTech', location: 'Mumbai', size: '501-1000' },
  { name: 'GreenByte Solutions', email: 'company10@example.com', industry: 'Software Products', location: 'Pune', size: '201-500' },
];

/* ------------------------------ INTERNSHIP TEMPLATES ------------------------------ */
// [title, required "Skill:H|M|L", preferred, tags]
const DOMAINS = {
  'Java Development': { company: [0, 9, 8], stipend: 15000, variants: [
    ['Java Developer Intern', 'Java:H,Spring Boot:H,MySQL:M,Git:M,REST APIs:M', 'Docker,JUnit', 'java,backend'],
    ['Java Full Stack Developer Intern', 'Java:H,Spring Boot:H,React:H,MongoDB:M,Git:L', 'Docker', 'java,full stack,web'],
    ['Backend Java Engineer Intern', 'Java:H,Hibernate:M,SQL:H,REST APIs:H,Docker:L', 'AWS,Kubernetes', 'java,backend,microservices'],
    ['Software Engineer Intern (Java)', 'Java:H,Data Structures:H,SQL:M,Git:M', 'Spring Boot,Docker', 'java,software engineering'],
  ] },
  'MERN Stack': { company: [1, 0, 9], stipend: 18000, variants: [
    ['MERN Stack Developer Intern', 'React:H,Node.js:H,Express.js:H,MongoDB:H,Git:M', 'TypeScript,Docker', 'mern,full stack,web'],
    ['Full Stack Web Developer Intern', 'JavaScript:H,React:H,Node.js:H,MongoDB:M,REST APIs:M', 'Tailwind CSS,Redux', 'full stack,web'],
    ['Node.js Backend Intern', 'Node.js:H,Express.js:H,MongoDB:H,REST APIs:M,Git:M', 'Docker,AWS', 'backend,node'],
    ['Next.js Full Stack Intern', 'Next.js:H,React:H,TypeScript:M,MongoDB:M,Tailwind CSS:L', 'AWS', 'full stack,next'],
  ] },
  'Frontend Development': { company: [1, 4, 9], stipend: 14000, variants: [
    ['React Frontend Developer Intern', 'React:H,JavaScript:H,HTML:M,CSS:M,Git:M', 'TypeScript,Tailwind CSS', 'frontend,react'],
    ['Frontend Engineer Intern', 'JavaScript:H,TypeScript:H,React:H,CSS:M', 'Next.js,Figma', 'frontend,web'],
    ['UI Developer Intern', 'HTML:H,CSS:H,JavaScript:M,Tailwind CSS:M,Figma:L', 'React', 'frontend,ui'],
    ['Angular Developer Intern', 'Angular:H,TypeScript:H,HTML:M,CSS:M,Git:L', 'Redux', 'frontend,angular'],
  ] },
  'Backend Development': { company: [0, 8, 1], stipend: 16000, variants: [
    ['Backend Developer Intern', 'Node.js:H,SQL:H,REST APIs:H,Git:M,Docker:L', 'Redis,AWS', 'backend,api'],
    ['Python Backend Intern', 'Python:H,Django:H,REST APIs:H,PostgreSQL:M,Git:M', 'Docker,Redis', 'backend,python'],
    ['API Developer Intern', 'REST APIs:H,Express.js:M,MongoDB:M,JavaScript:M', 'Swagger,Docker', 'backend,api'],
    ['Database Engineering Intern', 'SQL:H,MySQL:H,MongoDB:M,Data Modeling:M,Linux:L', 'PostgreSQL,Redis', 'database,backend'],
  ] },
  'Python Development': { company: [9, 2, 6], stipend: 13000, variants: [
    ['Python Developer Intern', 'Python:H,Flask:M,SQL:M,Git:M,REST APIs:M', 'Docker', 'python,backend'],
    ['Django Developer Intern', 'Python:H,Django:H,PostgreSQL:M,HTML:L,Git:M', 'Docker', 'python,django,web'],
    ['Python Automation Intern', 'Python:H,Linux:M,Git:M,Bash:L', 'AWS', 'python,automation'],
    ['FastAPI Developer Intern', 'Python:H,FastAPI:H,SQL:M,Docker:M,REST APIs:M', 'MongoDB', 'python,backend,api'],
  ] },
  'Machine Learning': { company: [6, 2, 1], stipend: 20000, custom: { datasetAccess: 'Provided', publicationOpportunity: true }, variants: [
    ['Machine Learning Intern', 'Python:H,Machine Learning:H,Pandas:H,Scikit-learn:M,NumPy:M', 'TensorFlow,SQL', 'ml,ai,data'],
    ['Deep Learning Intern', 'Python:H,Deep Learning:H,TensorFlow:H,NumPy:M,Machine Learning:M', 'PyTorch', 'deep learning,ai'],
    ['Applied ML Engineer Intern', 'Python:H,Machine Learning:H,Scikit-learn:H,Git:M,Docker:L', 'AWS', 'ml,mlops'],
    ['NLP Research Intern', 'Python:H,NLP:H,Machine Learning:M,PyTorch:M,Pandas:L', 'Docker', 'nlp,ai,research'],
  ] },
  'Data Science': { company: [2, 8, 6], stipend: 17000, variants: [
    ['Data Science Intern', 'Python:H,Pandas:H,SQL:H,Data Visualization:M,Statistics:M', 'Machine Learning,Tableau', 'data science,analytics'],
    ['Data Analyst Intern', 'SQL:H,Excel:H,Power BI:M,Python:M,Statistics:M', 'Tableau', 'data analyst,analytics'],
    ['Business Intelligence Intern', 'Power BI:H,SQL:H,Excel:M,Data Visualization:M', 'Python', 'bi,analytics'],
    ['Data Engineering Intern', 'Python:H,SQL:H,Apache Spark:M,Pandas:M,AWS:L', 'Docker', 'data engineering'],
  ] },
  AI: { company: [6, 2, 1], stipend: 22000, variants: [
    ['AI Engineer Intern', 'Python:H,Machine Learning:H,Deep Learning:M,NLP:M,Git:L', 'Docker', 'ai,ml'],
    ['Generative AI Intern', 'Python:H,NLP:H,Deep Learning:M,REST APIs:M,Git:L', 'FastAPI,Docker', 'ai,genai'],
    ['Computer Vision Intern', 'Python:H,Computer Vision:H,Deep Learning:H,NumPy:M,OpenCV:M', 'PyTorch', 'ai,vision'],
    ['AI Research Assistant Intern', 'Python:H,Machine Learning:H,Statistics:M,PyTorch:M,Git:L', 'NumPy', 'ai,research'],
  ] },
  'Cloud Computing': { company: [3, 8, 0], stipend: 18000, variants: [
    ['Cloud Engineer Intern', 'AWS:H,Linux:H,Docker:M,Networking:M,Git:L', 'Terraform,Python', 'cloud,aws'],
    ['Azure Cloud Intern', 'Azure:H,Linux:M,Networking:M,Docker:M,PowerShell:L', 'Terraform', 'cloud,azure'],
    ['Cloud Solutions Intern', 'AWS:H,Python:M,SQL:M,Docker:M,REST APIs:L', 'Kubernetes', 'cloud,solutions'],
    ['GCP Cloud Developer Intern', 'GCP:H,Docker:M,Python:M,Kubernetes:M,Git:L', 'Terraform', 'cloud,gcp'],
  ] },
  Cybersecurity: { company: [5, 3, 8], stipend: 16000, custom: { backgroundCheck: true, certificationsPreferred: ['CEH', 'Security+'] }, variants: [
    ['Cybersecurity Analyst Intern', 'Cybersecurity:H,Network Security:H,Linux:M,Python:L,SIEM:M', 'OWASP', 'security,soc'],
    ['Penetration Testing Intern', 'Penetration Testing:H,Kali Linux:M,Network Security:M,OWASP:H,Python:L', 'Burp Suite', 'security,pentest'],
    ['Application Security Intern', 'OWASP:H,JavaScript:M,REST APIs:M,Cybersecurity:M,Git:L', 'Docker', 'appsec,security'],
    ['Security Operations Intern', 'SIEM:H,Network Security:M,Linux:M,Cybersecurity:H', 'Python', 'soc,security'],
  ] },
  DevOps: { company: [3, 0, 9], stipend: 17000, custom: { onCall: false, cloudCredits: 'USD 100' }, variants: [
    ['DevOps Engineer Intern', 'Docker:H,Linux:H,CI/CD:H,Git:M,AWS:M', 'Kubernetes,Terraform', 'devops,cicd'],
    ['CI/CD Pipeline Intern', 'Jenkins:H,GitHub Actions:M,Git:H,Docker:M,Linux:M', 'Kubernetes', 'devops,cicd'],
    ['Site Reliability Intern', 'Linux:H,Python:M,Kubernetes:M,Monitoring:M,Docker:M', 'Terraform', 'sre,devops'],
    ['Platform Engineering Intern', 'Kubernetes:H,Docker:H,Terraform:M,AWS:M,Git:M', 'Helm', 'platform,devops'],
  ] },
  'UI/UX': { company: [4, 1, 7], stipend: 12000, open: true, custom: { portfolioRequired: true, tools: ['Figma'] }, variants: [
    ['UI/UX Design Intern', 'UI/UX:H,Figma:H,Wireframing:M,Prototyping:M,User Research:L', 'Adobe XD', 'design,ui,ux'],
    ['Product Design Intern', 'Figma:H,Prototyping:H,User Research:M,UI/UX:M,Wireframing:L', 'HTML,CSS', 'design,product'],
    ['UX Researcher Intern', 'User Research:H,UI/UX:M,Wireframing:M,Figma:L,Usability Testing:M', 'Excel', 'ux,research'],
    ['Visual Designer Intern', 'Figma:H,Adobe XD:M,UI/UX:M,Illustration:L', 'Motion Design', 'design,visual'],
  ] },
  'Mobile Development': { company: [7, 4, 1], stipend: 15000, custom: { devicesProvided: true }, variants: [
    ['Flutter Developer Intern', 'Flutter:H,Dart:H,REST APIs:M,Git:M,Firebase:L', 'UI/UX', 'mobile,flutter'],
    ['Android Developer Intern', 'Android:H,Kotlin:H,Java:M,REST APIs:M,Git:L', 'Jetpack Compose', 'mobile,android'],
    ['React Native Developer Intern', 'React Native:H,JavaScript:H,React:M,REST APIs:M,Git:L', 'TypeScript', 'mobile,react native'],
    ['iOS Developer Intern', 'Swift:H,iOS:H,REST APIs:M,Git:M,UI/UX:L', 'SwiftUI', 'mobile,ios'],
  ] },
};

const LOCATIONS = ['Pune', 'Mumbai', 'Bangalore', 'Hyderabad', 'Delhi', 'Noida', 'Chennai', 'Remote'];
const BRANCH_SETS = [[], [], ['Computer Science', 'Information Technology'], ['Computer Science', 'Information Technology', 'Electronics'], ['Computer Science']];
const GRAD_SETS = [[2026, 2027], [2026, 2027], [2026], [2027], [2026, 2027, 2028]];
const RESP = {
  default: ['Work with the engineering team on real product features', 'Write clean, tested and documented code', 'Participate in code reviews and sprint planning', 'Present your work in weekly demos'],
  design: ['Create wireframes and high-fidelity prototypes', 'Conduct user research and usability tests', 'Collaborate with developers to ship designs', 'Maintain the design system'],
  data: ['Clean and analyse large datasets', 'Build models or dashboards for business questions', 'Document experiments and findings', 'Present insights to stakeholders'],
};
const BENEFITS = ['Certificate of completion', 'Mentorship from senior engineers', 'Pre-placement offer (PPO) opportunity', 'Flexible working hours', 'Letter of recommendation'];

function buildInternships(now = new Date()) {
  const out = [];
  let n = 0;
  for (const [domain, d] of Object.entries(DOMAINS)) {
    d.variants.forEach(([title, req, pref, tags], vi) => {
      const companyIndex = d.company[vi % d.company.length];
      const company = COMPANIES[companyIndex];
      const location = rnd() < 0.45 ? company.location : pick(LOCATIONS);
      const workMode = location === 'Remote' ? 'Remote' : pick(['Onsite', 'Hybrid', 'Hybrid']);
      const base = d.stipend + between(-3, 5) * 1000;
      const isDesign = domain === 'UI/UX';
      const days = n === 0 ? 1 : n === 1 ? 2 : n === 2 ? 6 : between(8, 75);
      const dataDomain = ['Machine Learning', 'Data Science', 'AI'].includes(domain);
      const requiredSkills = parseReq(req);
      out.push({
        companyIndex, title, domain, description: `${company.name} is looking for a motivated ${title.toLowerCase().replace(' intern', '')} intern to join our ${domain} team. You will work on production-grade projects using ${requiredSkills.slice(0, 3).map((s) => s.name).join(', ')} and learn from experienced mentors.`,
        requiredSkills, preferredSkills: list(pref), tags: list(tags),
        eligibility: { minCGPA: d.open ? pick([0, 6, 7]) : pick([0, 6, 6.5, 7, 7.5, 8, 8.5]), branches: d.open ? [] : pick(BRANCH_SETS), graduationYears: pick(GRAD_SETS), requiredDegree: !d.open && rnd() < 0.2 ? 'B.Tech' : 'Any' },
        location, workMode, duration: pick([2, 3, 4, 6, 6, 6, 3]), stipend: { min: Math.round((base * 0.8) / 1000) * 1000, max: Math.round(base / 1000) * 1000, currency: 'INR' },
        responsibilities: isDesign ? RESP.design : dataDomain ? RESP.data : RESP.default, benefits: shuffle(BENEFITS).slice(0, 3), openings: between(1, 5),
        applicationDeadline: new Date(now.getTime() + days * 86400000), status: 'active', approvalStatus: 'approved', customFields: d.custom || {},
      });
      n += 1;
    });
  }
  // lifecycle variety: 3 pending approval, 3 expired/closed
  [5, 17, 30].forEach((i) => { out[i].approvalStatus = 'pending'; });
  [8, 22, 40].forEach((i) => { out[i].status = 'closed'; out[i].applicationDeadline = new Date(now.getTime() - (i % 5 + 2) * 86400000); });
  return out;
}

/* ------------------------------ STUDENTS ------------------------------ */
const sk = (s) => s.split(',').map((x) => { const [name, proficiency = 'Intermediate', years = '1'] = x.trim().split(':'); return { name, category: categoryOf(name), proficiency, yearsOfExperience: Number(years) }; });
const proj = (title, technologies, description, role = 'Developer') => ({ title, description, technologies, role, githubUrl: `https://github.com/example/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` });
const cert = (name, issuer) => ({ name, issuer, issueDate: new Date(2025, between(0, 11), between(1, 28)), credentialUrl: 'https://example.com/credential' });

const PERSONAS = [
  { name: 'Aarav Deshmukh', email: 'student@example.com', degree: 'B.Tech', branch: 'Computer Science', college: 'College of Engineering Pune', year: 2026, cgpa: 8.4,
    skills: sk('Java:Advanced:2,Spring Boot:Intermediate:1,MongoDB:Intermediate:1,MySQL:Intermediate:1,Git:Intermediate:2,REST APIs:Intermediate:1'),
    projects: [proj('Online Bookstore API', ['Java', 'Spring Boot', 'MongoDB', 'REST APIs'], 'REST backend for an online bookstore with JWT security.'), proj('Library Management System', ['Java', 'MySQL'], 'Desktop app for library operations.')],
    certs: [cert('Oracle Java SE Certified', 'Oracle')], interests: ['Java Development', 'Backend Development'], prefs: { domains: ['Java Development'], locations: ['Pune', 'Mumbai'], workModes: ['Hybrid', 'Onsite'], durationPreference: 6, minStipend: 10000 } },
  { name: 'Isha Kulkarni', email: 'student2@example.com', degree: 'B.Tech', branch: 'Information Technology', college: 'VIT Pune', year: 2026, cgpa: 8.9,
    skills: sk('React:Advanced:2,Node.js:Advanced:2,MongoDB:Intermediate:2,Express.js:Intermediate:2,JavaScript:Advanced:3,Git:Intermediate:2,Tailwind CSS:Intermediate:1'),
    projects: [proj('Expense Tracker', ['React', 'Node.js', 'Express.js', 'MongoDB', 'JWT'], 'MERN expense tracker with charts and authentication.', 'Full Stack Developer'), proj('DevConnect', ['React', 'Node.js', 'MongoDB', 'Socket.io'], 'Developer social network with real-time chat.')],
    certs: [cert('Meta Front-End Developer', 'Coursera')], interests: ['Full Stack Development', 'MERN Stack', 'Web Development'], prefs: { domains: ['MERN Stack'], locations: ['Pune', 'Bangalore', 'Remote'], workModes: ['Hybrid', 'Remote'], durationPreference: 6, minStipend: 12000 } },
  { name: 'Rohan Mehta', email: 'student3@example.com', degree: 'B.Tech', branch: 'Computer Science', college: 'IIIT Hyderabad', year: 2027, cgpa: 7.6,
    skills: sk('Python:Advanced:3,Machine Learning:Intermediate:1,Pandas:Intermediate:2,NumPy:Intermediate:2,Scikit-learn:Intermediate:1,SQL:Intermediate:1'),
    projects: [proj('House Price Predictor', ['Python', 'Pandas', 'Scikit-learn', 'NumPy'], 'Regression models for housing prices with feature engineering.', 'ML Engineer'), proj('Sentiment Analyzer', ['Python', 'NLP', 'Scikit-learn'], 'Twitter sentiment classifier.')],
    certs: [cert('Machine Learning Specialization', 'Coursera')], interests: ['Machine Learning', 'Data Science', 'AI'], prefs: { domains: ['Machine Learning'], locations: ['Bangalore', 'Hyderabad', 'Remote'], workModes: ['Remote', 'Hybrid'], durationPreference: 4, minStipend: 15000 } },
  { name: 'Sneha Iyer', email: 'student4@example.com', degree: 'B.Des', branch: 'Design', college: 'MIT Institute of Design', year: 2026, cgpa: 8.1,
    skills: sk('UI/UX:Advanced:3,Figma:Advanced:3,Wireframing:Advanced:2,Prototyping:Intermediate:2,Adobe XD:Intermediate:1,HTML:Beginner:1,CSS:Beginner:1'),
    projects: [proj('Healthcare App Redesign', ['Figma', 'UI/UX', 'Prototyping'], 'Case study redesigning a hospital appointment app.', 'UX Designer'), proj('E-commerce Design System', ['Figma', 'Wireframing'], 'Reusable component library.')],
    certs: [cert('Google UX Design Certificate', 'Coursera')], interests: ['UI/UX Design', 'Product Design'], prefs: { domains: ['UI/UX'], locations: ['Delhi', 'Mumbai', 'Remote'], workModes: ['Remote', 'Hybrid'], durationPreference: 3, minStipend: 8000 } },
];

const ARCHETYPES = [
  { key: 'java', skills: 'Java:Advanced:2,Spring Boot:Intermediate:1,MySQL:Intermediate:1,Git:Intermediate:1,Hibernate:Beginner:1', projects: [['Inventory Manager', ['Java', 'Spring Boot', 'MySQL']], ['Hospital Portal', ['Java', 'Hibernate', 'MySQL']]], interests: ['Java Development', 'Backend Development'], domains: ['Java Development'] },
  { key: 'mern', skills: 'React:Intermediate:1,Node.js:Intermediate:1,MongoDB:Intermediate:1,JavaScript:Advanced:2,Express.js:Intermediate:1,Git:Intermediate:1', projects: [['Task Manager', ['React', 'Node.js', 'MongoDB', 'Express.js']], ['Food Delivery UI', ['React', 'CSS']]], interests: ['Full Stack Development', 'Web Development'], domains: ['MERN Stack'] },
  { key: 'ml', skills: 'Python:Advanced:2,Machine Learning:Intermediate:1,Pandas:Intermediate:1,NumPy:Intermediate:1,TensorFlow:Beginner:1', projects: [['Churn Predictor', ['Python', 'Pandas', 'Scikit-learn']], ['Digit Recognizer', ['Python', 'TensorFlow', 'NumPy']]], interests: ['Machine Learning', 'AI'], domains: ['Machine Learning'] },
  { key: 'data', skills: 'SQL:Advanced:2,Excel:Advanced:2,Power BI:Intermediate:1,Python:Intermediate:1,Statistics:Intermediate:1', projects: [['Sales Dashboard', ['Power BI', 'SQL', 'Excel']], ['Retail Analytics', ['Python', 'Pandas', 'SQL']]], interests: ['Data Science', 'Data Analytics'], domains: ['Data Science'] },
  { key: 'devops', skills: 'Docker:Intermediate:1,Linux:Advanced:2,Git:Advanced:2,Jenkins:Beginner:1,AWS:Beginner:1', projects: [['CI Pipeline for Blog', ['Jenkins', 'Docker', 'Git']], ['Home Lab Server', ['Linux', 'Docker']]], interests: ['DevOps', 'Cloud Computing'], domains: ['DevOps'] },
  { key: 'cloud', skills: 'AWS:Intermediate:1,Linux:Intermediate:1,Python:Intermediate:1,Docker:Beginner:1,Networking:Intermediate:1', projects: [['Serverless Image Resizer', ['AWS', 'Python']], ['Static Site on S3', ['AWS', 'Linux']]], interests: ['Cloud Computing'], domains: ['Cloud Computing'] },
  { key: 'security', skills: 'Cybersecurity:Intermediate:1,Network Security:Intermediate:1,Linux:Intermediate:2,Kali Linux:Intermediate:1,Python:Beginner:1', projects: [['Vulnerability Scanner', ['Python', 'Network Security']], ['CTF Writeups', ['Kali Linux', 'Cybersecurity']]], interests: ['Cybersecurity'], domains: ['Cybersecurity'] },
  { key: 'flutter', skills: 'Flutter:Intermediate:1,Dart:Intermediate:1,Firebase:Intermediate:1,REST APIs:Beginner:1,Git:Beginner:1', projects: [['Fitness Tracker App', ['Flutter', 'Dart', 'Firebase']], ['Notes App', ['Flutter', 'Dart']]], interests: ['Mobile Development'], domains: ['Mobile Development'] },
  { key: 'android', skills: 'Android:Intermediate:1,Kotlin:Intermediate:1,Java:Intermediate:2,REST APIs:Beginner:1', projects: [['Expense Splitter', ['Android', 'Kotlin']], ['Weather App', ['Android', 'Java', 'REST APIs']]], interests: ['Mobile Development', 'Android'], domains: ['Mobile Development'] },
  { key: 'frontend', skills: 'React:Advanced:2,JavaScript:Advanced:2,TypeScript:Intermediate:1,HTML:Advanced:2,CSS:Advanced:2,Tailwind CSS:Intermediate:1', projects: [['Portfolio Builder', ['React', 'Tailwind CSS', 'TypeScript']], ['Movie Explorer', ['React', 'JavaScript', 'CSS']]], interests: ['Frontend Development', 'Web Development'], domains: ['Frontend Development'] },
  { key: 'ux', skills: 'UI/UX:Intermediate:1,Figma:Advanced:2,Wireframing:Intermediate:1,User Research:Beginner:1,Prototyping:Intermediate:1', projects: [['Travel App Concept', ['Figma', 'UI/UX']], ['Banking App Redesign', ['Figma', 'Prototyping']]], interests: ['UI/UX Design'], domains: ['UI/UX'] },
  { key: 'nlp', skills: 'Python:Advanced:2,NLP:Intermediate:1,Deep Learning:Intermediate:1,PyTorch:Beginner:1,Machine Learning:Intermediate:1', projects: [['Resume Screener', ['Python', 'NLP', 'Machine Learning']], ['Chatbot', ['Python', 'PyTorch', 'NLP']]], interests: ['AI', 'Machine Learning'], domains: ['AI'] },
  { key: 'django', skills: 'Python:Advanced:2,Django:Intermediate:1,PostgreSQL:Intermediate:1,REST APIs:Intermediate:1,Git:Intermediate:1', projects: [['Blog Platform', ['Python', 'Django', 'PostgreSQL']], ['Polling API', ['Django', 'REST APIs']]], interests: ['Backend Development', 'Python Development'], domains: ['Python Development'] },
];
const NAMES = ['Priya Sharma', 'Aditya Joshi', 'Neha Patil', 'Karan Verma', 'Ananya Reddy', 'Vikram Singh', 'Pooja Nair', 'Siddharth Rao', 'Meera Gupta', 'Rahul Kapoor', 'Divya Menon', 'Arjun Bhat', 'Kavya Pillai', 'Manish Tiwari', 'Shruti Kulkarni', 'Nikhil Agarwal', 'Tanvi Shah', 'Yash Chauhan', 'Riya Banerjee', 'Harsh Vora', 'Aishwarya More', 'Omkar Jadhav', 'Simran Kaur', 'Varun Malhotra', 'Pallavi Desai', 'Sahil Khan'];
const COLLEGES = ['COEP Pune', 'IIT Bombay', 'BITS Pilani', 'NIT Trichy', 'VJTI Mumbai', 'DTU Delhi', 'PES University', 'JNTU Hyderabad', 'SRM Chennai', 'Symbiosis Pune'];
const BRANCHES = ['Computer Science', 'Computer Science', 'Computer Science', 'Information Technology', 'Information Technology', 'Electronics', 'Electrical', 'Mechanical'];

function buildStudents() {
  const students = [...PERSONAS];
  NAMES.forEach((name, i) => {
    const a = ARCHETYPES[i % ARCHETYPES.length];
    const locs = shuffle(LOCATIONS).slice(0, between(1, 3));
    students.push({
      name, email: `student${i + 5}@example.com`, degree: pick(['B.Tech', 'B.Tech', 'B.Tech', 'M.Tech', 'BCA']), branch: pick(BRANCHES), college: pick(COLLEGES),
      year: pick([2026, 2026, 2027]), cgpa: +(6 + rnd() * 3.4).toFixed(1),
      skills: sk(a.skills).filter((_, idx) => idx < 3 || rnd() < 0.8),
      projects: a.projects.slice(0, between(1, 2)).map(([t, tech]) => proj(t, tech, `${t} - academic/personal project.`)),
      certs: rnd() < 0.5 ? [cert(pick(['AWS Cloud Practitioner', 'Google Data Analytics', 'Coursera Specialization', 'NPTEL Certificate']), 'Various')] : [],
      interests: a.interests, prefs: { domains: a.domains, locations: locs, workModes: shuffle(['Onsite', 'Hybrid', 'Remote']).slice(0, between(1, 2)), durationPreference: pick([3, 4, 6]), minStipend: pick([0, 5000, 10000]) },
    });
  });
  return students;
}

module.exports = { SKILL_CATALOG, LEARNING: LEARNING.concat(require('./learningExtra')), COMPANIES, buildInternships, buildStudents, DOMAINS, LOCATIONS, rnd, pick, between, shuffle, categoryOf };
