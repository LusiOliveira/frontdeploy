# Diagrama de Arquitetura — EletroLight

> **PlantUML** — Use o [PlantUML Online](http://www.plantuml.com/plantuml) ou extensão do VS Code.

```plantuml
@startuml

skinparam backgroundColor #fefefe
skinparam shadowing false
skinparam rectangle {
    BackgroundColor #f5f5f5
    BorderColor #424242
    BorderThickness 2
    RoundCorner 15
}

skinparam arrow {
    Color #01579b
    Thickness 2
}

title EletroLight - Arquitetura Geral do Sistema

rectangle "Cliente / Usuário" as Cliente {
    rectangle "Navegador\n(Chrome, Firefox, Edge, Safari)" as Navegador
}

rectangle "Front-end" as Frontend {
    rectangle "HTML5\n(Estrutura)" as HTML
    rectangle "CSS3\n(Estilos)" as CSS
    rectangle "JavaScript\n(Vanilla)" as JS
}

rectangle "Back-end API" as Backend {
    rectangle "Spring Boot\n(Java 17)" as Spring
    rectangle "Spring Security\n(Autenticação)" as Security
    rectangle "REST API\n(Controllers)" as API
    rectangle "Compressão\nde Imagens" as ImgCompress
}

rectangle "Persistência" as Persistencia {
    rectangle "PostgreSQL\n(Banco de Dados)" as Postgres
    rectangle "Base64\n(Imagens Anúncios)" as Base64
}

rectangle "Serviços Externos" as Externos {
    rectangle "Supabase Storage\n(Thumbnails Conteúdo)" as Supabase
}

' Conexões
Cliente --> Frontend : HTTP/HTTPS
Frontend --> Backend : Requisições REST\n(JSON + JWT)
Backend --> Persistencia : JDBC / Hibernate\n(SQL)
Backend --> Externos : HTTP\n(Upload Thumbnails)

@enduml
```

---

# Diagrama de Classes — EletroLight (Domínio / JPA)

> **UML conforme OMG** — Diagrama de classes de domínio extraído do pacote `com.projetoEletro.domain.model`.

```plantuml
@startuml

skinparam backgroundColor #fefefe
skinparam shadowing false
skinparam classAttributeIconSize 0
skinparam class {
    BackgroundColor #f5f5f5
    BorderColor #424242
    BorderThickness 2
    ArrowColor #01579b
    ArrowThickness 2
}

title EletroLight - Diagrama de Classes de Domínio

class Usuario {
    - Long id
    - String email
    - String senha
    - String foto
    - String resetToken
    - String resetTokenExpires
    - Boolean bloqueioPublicacao
    - Boolean bloqueioChat
}

class Pessoa {
    - Long id
    - String nome
    - String cpf
    - LocalDate dataNascimento
    - String whatsapp
}

class Anuncio {
    - Long id
    - String titulo
    - String descricao
    - String tipo
    - String condicao
    - String marca
    - String foto
    - String bairro
    - String nome
    - String email
    - String whatsapp
    - String status
    - LocalDateTime dataPublicacao
}

class Categoria {
    - Long id
    - String slug
    - String nome
    - String icone
}

class Grupo {
    - Long id
    - String descricao
}

class UsuarioGrupo {
    - Long id
}

class Mensagem {
    - Long id
    - String texto
    - String remetenteEmail
    - String remetenteNome
    - String destinatarioEmail
    - String destinatarioNome
    - LocalDateTime dataCriacao
}

class Denuncia {
    - Long id
    - String tipo
    - String alvoEmail
    - String alvoTitulo
    - String motivo
    - String descricao
    - String denuncianteEmail
    - String status
    - LocalDateTime dataCriacao
}

class ConteudoEducativo {
    - Long id
    - String titulo
    - String categoria
    - String texto
    - String linkVideo
    - String linkOriginal
    - String imagem
    - Boolean ativo
    - LocalDateTime dataCriacao
}

class PontoColeta {
    - Long id
    - String nome
    - String latitude
    - String longitude
    - String endereco
    - String horario
}

' Relacionamentos
Usuario "1" -- "1" Pessoa : possui >
Usuario "1" -- "0..*" Anuncio : publica >
Usuario "1" -- "0..*" Denuncia : registra >
Usuario "1" -- "0..*" UsuarioGrupo : participa >
Anuncio "1" -- "0..*" Mensagem : recebe >
Anuncio "*" -- "1" Categoria : classificado em >
Anuncio "1" -- "0..*" Denuncia : alvo de >
Grupo "1" -- "0..*" UsuarioGrupo : contém >
UsuarioGrupo "*" -- "1" Usuario
UsuarioGrupo "*" -- "1" Grupo

note right of Usuario
    **@Entity** — Tabela: usuario
    @OneToOne → Pessoa
    @OneToMany → Anuncio, Denuncia, UsuarioGrupo
end note

note right of Anuncio
    **@Entity** — Tabela: anuncio
    @ManyToOne → Usuario, Categoria
    @OneToMany → Mensagem, Denuncia
end note

note bottom of ConteudoEducativo
    Entidade independente
    (sem relacionamentos com outras classes)
end note

note bottom of PontoColeta
    Entidade independente
    (sem relacionamentos com outras classes)
end note

@enduml
```
