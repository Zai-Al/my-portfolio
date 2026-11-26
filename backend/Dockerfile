FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY *.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .
# The aspnet image already listens on 8080 (ASPNETCORE_HTTP_PORTS); setting ASPNETCORE_URLS
# too only made .NET warn that one overrides the other.
EXPOSE 8080
ENTRYPOINT ["dotnet", "PortfolioApi.dll"]
